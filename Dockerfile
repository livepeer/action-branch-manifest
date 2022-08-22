FROM	python:3-slim

LABEL	maintainer="Amritanshu Varshney <amritanshu+github@livepeer.org>"

WORKDIR	/app

COPY	script.py entrypoint.sh ./

ENTRYPOINT	[ "/app/entrypoint.sh" ]
