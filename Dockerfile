FROM python:3.9-slim-buster

WORKDIR /app
COPY /src /app
COPY ./requirements.txt /app/requirements.txt

RUN pip install -r requirements.txt

CMD ["python","/app/app.py"]
