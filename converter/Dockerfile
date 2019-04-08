FROM gcr.io/gcp-runtimes/ubuntu_18_0_4

COPY convert .npmrc /converter/

COPY without-package /converter/without-package
COPY with-package-without-framework /converter/with-package-without-framework
COPY with-package-with-framework /converter/with-package-with-framework

RUN apt-get update >/dev/null && \
    apt-get install -y jq >/dev/null

WORKDIR /workspace

ENTRYPOINT ["/converter/convert"]
