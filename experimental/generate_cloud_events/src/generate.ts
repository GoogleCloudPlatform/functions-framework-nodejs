// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as t from '@babel/types';
import generate from '@babel/generator';
import * as utils from './utils';
import * as fs from 'fs';
import * as path from 'path';
import {
  InterfaceDefinitionSchema,
  isEnumProp,
  isOneOfProp,
  isRefProp,
  SchemaProperty,
  TypeSchema,
  EventCatalog,
} from './schema_types';

/**
 * URL of the type catalog in the googleapis/google-cloudevents repo
 */
const ROOT_TYPE_CATALOG_URL =
  'https://googleapis.github.io/google-cloudevents/jsonschema/catalog.json';

/**
 * Create an AST node representing a schema property
 * @param property the schema property to generate the ast for
 * @returns an AST subtree represenging an TS type annotation
 */
const getTypeAnnotation = (property: SchemaProperty): t.TSTypeAnnotation => {
  if (isRefProp(property)) {
    return t.tsTypeAnnotation(
      t.tsTypeReference(
        t.identifier(property.$ref.replace('#/definitions/', ''))
      )
    );
  }

  if (isEnumProp(property)) {
    // TODO can we do better here?
    return t.tsTypeAnnotation(t.tsNumberKeyword());
  }

  if (isOneOfProp(property)) {
    return t.tsTypeAnnotation(
      t.tsUnionType(
        property.oneOf.map(p => getTypeAnnotation(p).typeAnnotation)
      )
    );
  }

  if (property.type === 'string') {
    return t.tsTypeAnnotation(t.tsStringKeyword());
  }

  if (property.type === 'integer' || property.type === 'number') {
    return t.tsTypeAnnotation(t.tsNumberKeyword());
  }

  if (property.type === 'boolean') {
    return t.tsTypeAnnotation(t.tsBooleanKeyword());
  }

  if (property.type === 'object') {
    // TODO can we do better here?
    return t.tsTypeAnnotation(t.tsObjectKeyword());
  }

  if (property.type === 'array') {
    if (property.items) {
      const elemType = getTypeAnnotation(property.items);
      return t.tsTypeAnnotation(t.tsArrayType(elemType.typeAnnotation));
    } else {
      // TODO can we do better here?
      return t.tsTypeAnnotation(t.tsArrayType(t.tsAnyKeyword()));
    }
  }
  throw `encounted unknown property: ${JSON.stringify(property)}`;
};

/**
 * Generate an AST for the interface body from a collection of schema properties.
 * @param properties The Schema properties to include in the interface
 * @returns an AST subtree representing a TS interface body
 */
const generateInterfaceBody = (properties: {
  [key: string]: SchemaProperty;
}): t.TSInterfaceBody => {
  return t.tsInterfaceBody(
    Object.keys(properties).map(propName => {
      const prop = properties[propName];
      const foo = t.tsPropertySignature(
        t.identifier(propName),
        getTypeAnnotation(prop),
        null
      );
      utils.addComment(foo, prop.description);
      return foo;
    })
  );
};

/**
 * Generate the AST for the import declaration that pulls in the base CloudEvent interface.
 */
const generateCloudEventImport = (): t.Statement => {
  return t.importDeclaration(
    [
      t.importSpecifier(
        t.identifier('CloudEventsContext'),
        t.identifier('CloudEventsContext')
      ),
    ],
    t.stringLiteral('./cloud_events_context')
  );
};

/**
 * Generate all interfaces in a given cloudevent schema
 * @param schema The cloudevent data payload schema
 * @returns a set of Statement AST nodes representing interfaces declarations
 */
const generateInterfaces = (schema: TypeSchema): t.Statement[] => {
  const definitions: {[key: string]: InterfaceDefinitionSchema} =
    schema.definitions;

  return Object.keys(definitions).map(definition => {
    const interfaceStmt = t.tsInterfaceDeclaration(
      t.identifier(definition),
      null,
      null,
      generateInterfaceBody(definitions[definition].properties)
    );
    const exportStmt = t.exportNamedDeclaration(interfaceStmt);
    utils.addComment(exportStmt, definitions[definition].description, true);
    return exportStmt;
  });
};

/**
 * Generate the Cloudevent interface AST for a given cloudevent data payload schema
 * @param schema the cloudevent data playload to generate the cloudevent interface for
 * @returns an AST node represting a TS interface
 */
const generateCloudEventInterface = (schema: TypeSchema): t.Statement => {
  const typeTypes = schema.cloudeventTypes.map(x =>
    t.tsLiteralType(t.stringLiteral(x))
  );
  const exportStmt = t.exportNamedDeclaration(
    t.tsInterfaceDeclaration(
      t.identifier(schema.name.replace(/Data$/, 'CloudEvent')),
      null,
      [t.tsExpressionWithTypeArguments(t.identifier('CloudEventsContext'))],
      t.tsInterfaceBody([
        t.tsPropertySignature(
          t.identifier('type'),
          t.tsTypeAnnotation(
            typeTypes.length === 1 ? typeTypes[0] : t.tsUnionType(typeTypes)
          )
        ),
        t.tsPropertySignature(
          t.identifier('data'),
          t.tsTypeAnnotation(t.tsTypeReference(t.identifier(schema.name)))
        ),
      ])
    )
  );
  utils.addComment(
    exportStmt,
    `The schema of CloudEvents emmitted by ${schema.product}.`,
    true
  );
  return exportStmt;
};

/**
 * Kick off the code generation pipeline by downloading the JSON manifest from
 * googleapis/google-cloudevents
 */
utils.fetch(ROOT_TYPE_CATALOG_URL).then(catalog => {
  const rootImports: {
    importPath: string;
    ceDataTypeName: string;
    ceInterface: t.Statement;
  }[] = [];
  const promises = (catalog as EventCatalog).schemas.map(async catSchema => {
    const schema = (await utils.fetch(catSchema.url)) as TypeSchema;
    const interfaces = generateInterfaces(schema);

    const ast = t.file(t.program(interfaces));
    rootImports.push({
      importPath: utils.getCloudEventImportPath(catSchema.url),
      ceDataTypeName: schema.name,
      ceInterface: generateCloudEventInterface(schema),
    });
    utils.addCopyright(ast);
    const {code} = generate(ast);
    const fileName = utils.getDataFilePath(catSchema.url);
    fs.mkdirSync(path.dirname(fileName), {recursive: true});
    fs.writeFileSync(fileName, code);
  });

  Promise.all(promises).then(() => {
    const imports: t.Statement[] = rootImports
      .sort((a, b) => (a.importPath > b.importPath ? 1 : -1))
      .map(({importPath, ceDataTypeName}) => {
        return t.importDeclaration(
          [
            t.importSpecifier(
              t.identifier(ceDataTypeName),
              t.identifier(ceDataTypeName)
            ),
          ],
          t.stringLiteral(importPath)
        );
      });

    imports.push(generateCloudEventImport());

    imports.push(...rootImports.map(x => x.ceInterface));

    const googleCloudEventExport = t.exportNamedDeclaration(
      t.tsTypeAliasDeclaration(
        t.identifier('GoogleCloudEvent'),
        null,
        t.tsUnionType(
          rootImports.map(x =>
            t.tsTypeReference(
              t.identifier(utils.getCloudEventTypeName(x.ceDataTypeName))
            )
          )
        )
      )
    );
    utils.addComment(
      googleCloudEventExport,
      'Union of all known CloudEvents emitted by Google Cloud services'
    );

    imports.push(googleCloudEventExport);
    const ast = t.file(t.program(imports));
    utils.addCopyright(ast);

    const {code} = generate(ast);
    fs.writeFileSync(utils.RELATIVE_SRC_DIR + '/google_cloud_event.ts', code);
  });
});
