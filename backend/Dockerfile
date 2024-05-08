# build stage
FROM python:3.10 AS builder

# set workdir
WORKDIR /app

# install PDM
RUN pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/ && pip install -U pip setuptools wheel && pip install pdm

# copy files
COPY pyproject.toml pdm.lock README.md requirements.txt /app/

# install dependencies and project into the local packages directory
RUN pdm config pypi.url https://mirrors.aliyun.com/pypi/simple/ && mkdir __pypackages__ && pdm install --prod --no-lock --no-editable

# run stage
FROM python:3.10

# set workdir
WORKDIR /app
RUN echo "deb https://mirrors.aliyun.com/debian/ bookworm main non-free non-free-firmware contrib" > /etc/apt/sources.list
RUN rm /etc/apt/sources.list.d/debian.sources

RUN pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/
# RUN apt-get update && apt-get -y install vim

# set env
ENV PYTHONPATH=/app/pkgs

# retrieve packages from build stage
COPY --from=builder /app/__pypackages__/3.10/lib /app/pkgs

# copy files
COPY ./ /app/

# version
ARG APP_VERSION=0.0.1
ENV APP_VERSION ${APP_VERSION}


# set entrypoint
CMD [ "sh", "/app/scripts/start.sh" ]