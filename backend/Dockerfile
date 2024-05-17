# build stage
FROM python:3.11 AS builder

# set workdir
WORKDIR /app

# install PDM
RUN pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/ && pip install -U pip setuptools wheel && pip install pdm

# copy files
COPY pyproject.toml pdm.lock README.md /app/

# install dependencies and project into the local packages directory
RUN pdm config pypi.url https://mirrors.aliyun.com/pypi/simple/ && mkdir __pypackages__ && pdm install --prod --no-lock --no-editable


# run stage
FROM python:3.11

# set workdir
WORKDIR /app

# set env
ARG APP_VERSION
ENV PYTHONPATH=/app/pkgs
ENV APP_VERSION ${APP_VERSION}

RUN apt install libmagic1
# retrieve packages from build stage
COPY --from=builder /app/__pypackages__/3.11/lib /app/pkgs

# copy files
COPY ./ /app/

# set entrypoint
CMD [ "sh", "/app/scripts/start.sh" ]