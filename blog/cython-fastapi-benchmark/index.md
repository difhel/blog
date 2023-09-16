---
slug: cython-fastapi-benchmark
date: 2023-09-16T10:30
title: "Cython'им fastapi-проект: сравниваем скорость pure python и cython имплементаций"
authors: difhel
tags: [dev, python, cython]
image: ./cover.png 
telegram: difhel_b/39
---

## Что такое fastapi?
[fastapi](https://fastapi.tiangolo.com/) - имхо, самый лучший фреймворк для веб-разработки на Python, основными фичами которого являются:
- высокая производительность относительно других фреймворков на Python за счет использования starlette и uvicorn в качестве ASGI-сервера, [сравним по скорости с фреймворками на Go и NodeJS](https://fastapi.tiangolo.com/benchmarks/)
- простота использования - благодаря pydantic (для валидации запросов) и целой куче готовых подмодулей для любых задач (websockets, background tasks, система зависимостей компонентов приложения, middlewares и многое другое) очень легко и интуитивно понятно, как написать какую-то вещь
- полная типизация фреймворка и поддержка редакторами - меньше времени на дебаг и подсказки IDE
- автоматическая генерация документации (по схеме OpenAPI, Swagger и Redoc)

## Что такое cython?
[Cython](https://cython.org/) - это промежуточный слой между Python и C/C++. Cython позволяет писать обычный Python-код, добавляя функции из стандаратной библиотеки языков C/C++ и ускоряя код за счет использования C-типов (что, впрочем, не обязательно), который затем напрямую транслируется в C-код.


## Что будем делать?
В этом блоге попробуем ускорить и без того довольно быстрый проект на fastapi, ситонизируя (cythonize) его.
Для примера возьмем вот такой код (выдрал минимальный код из одного из текущих проектов, поэтому такая структура):

```py title="routes/ftl/ftl.py"
from fastapi import APIRouter

router = APIRouter(
    prefix="/ftl.",
    tags=["ftl"]
)


@router.get("test")
async def test_method():
    return {"ping": "pong"}
```

```py title="routes/__init__.py"
from .ftl import ftl
```

```py title="main.pyx"
from fastapi import FastAPI
import uvicorn
from routers import ftl


app = FastAPI()
app.include_router(ftl.router, prefix="/method")


@app.get("/")
async def root():
    return {"message": "Hello Bigger Applications!"}

uvicorn.run("main:app", host="127.0.0.1", port=5000, log_level="critical")
```

Тут мы создаем роутер для группы методов под названием `ftl` с одним методом - `ftl.test`.
Обычно для запуска fastapi-приложений используют uvicorn из терминала (примерно так):
```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 5000
```
Но так как мы скомпилируем проект в один бинарник, который можно будет запускать через `./app`, запуск ASGI-сервера мы засунули в код проекта.

Теперь установим нужные зависимости (желательно в виртуальном окружении):
```bash
pip3 install fastapi
pip3 install cython
pip3 install 'uvicorn[standard]'
```
:::warning
Обратите внимание, что мы ставим не обычный `uvicorn`, а `uvicorn[standart]` - его ситонизированную версию. Это даст некоторую прибавку в скорости даже при запуске pure python кода.
:::

### Ситонизируем и оцениваем!

Чтобы ситонизировать наш проект, потребуется написать олдскульный файл `setup.py`:
```py title="setup.py"
from setuptools import setup
from Cython.Build import cythonize

setup(
    ext_modules = cythonize("main.pyx")
)
```
Теперь напишем `builder.c` - файл для генерации единого бинарника со всем проектом:

```c title="builder.c"
#include <Python.h>

int main(int argc, char *argv[]) {
    // Инициализация интерпретатора Python
    Py_Initialize();

    // Вызов вашей функции из скомпилированной библиотеки
    PyObject *pName, *pModule, *pDict, *pFunc, *pValue;

    pName = PyUnicode_DecodeFSDefault("main.cpython-310-x86_64-linux-gnu");
    pModule = PyImport_Import(pName);
    pDict = PyModule_GetDict(pModule);
    pFunc = PyDict_GetItemString(pDict, "root");
    pValue = PyObject_CallObject(pFunc, NULL);

    // Вывод результата или обработка его каким-либо образом

    // Завершение интерпретатора Python
    Py_Finalize();

    return 0;
}
```
Да, он написан ChatGPT. Я не умею в Python API 😢

Собираем проект в единый бинарь:
```bash
cython main.pyx
python3 setup.py build_ext --build-lib=. # создаст файл main.c и скомпилит его в .so
gcc -o app.o builder.c -I/usr/include/python3.10 -lpython3.10 -Wall -g # компилим main.c в обычный бинарь (.o)
```

Запускаем:
```bash
export PYTHONPATH=`pwd` # укажем pythonpath в нашем виртуальном окружении
./app.o
```

Если все прошло хорошо, не будет выведено ничего, но проект запустится на 5000 порте. Проверить можно, сходив по адресу `http://localhost:5000/method/ftl.test`

Теперь пришло время бенчмарков. Для тестов будем использовать Apache Benchmark.
```bash
sudo apt install -y apache2-utils
```

```bash
ab -n 10000 -c 10 http://localhost:5000/method/ftl.test
```
Желательно не нагружать сеть во время проведения оценки.
:::info
Мы используем `log-level="critical"`, чтобы отключить логи о запросах. Логи выводятся в терминал и сильно и непредсказуемо замедляют работу приложения, из-за чего нельзя корректно оценить его скорость на бенчмарке.
:::

### Оцениваем этот же код без ситонизации
Для начала удалим `main.c` и `main.<arch>.so` из папки проекта, чтобы `uvicorn` использовал питоновскую версию, а не скомпиленную cythonized.

Далее нужно переименовать `main.pyx` в `main.py` и удалить (закомментировать) строчки, связанные с uvicorn:
```py title="main.py"
from fastapi import FastAPI
# import uvicorn
from routers import ftl


app = FastAPI()
app.include_router(ftl.router, prefix="/method")


@app.get("/")
async def root():
    return {"message": "Hello Bigger Applications!"}

# uvicorn.run("main:app", host="127.0.0.1", port=5000, log_level="critical")
```

Запускаем через терминал:
```bash
python3 -m uvicorn main:app --port 5000 --log-level critical
```

Далее используем ту же команду для запуска Apache Brenchmark:
```bash
ab -n 10000 -c 10 http://localhost:5000/method/ftl.test
```

## Результаты
В левом терминале запуск ситонизированного кода, в правом - обычного, на чистом Python.
![Результаты](./table.png)

В случае с Cython 90% запросов были обработаны за 6 миллисекунд, а самый долгий запрос был обработан за 17 миллисекунд (против 57 в бенчмарке обычного Python).

## Что-то вроде вывода
Даже не используя какие-то специфические вещи, вроде сложных вычислений или работы с памятью, которые были бы значительно быстрее в Cython, чем в Python, **Cython оказался в 3.35 раза быстрее точно такого же кода на чистом Python**. Это означает, что можно в несколько ускорить ваш проект, не внося почти никаких изменений, просто подключив Cython.

> Используйте Cython, господа!
>
> — я