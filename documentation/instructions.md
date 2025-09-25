# User Instructions

## Installation
Clone the Repository
In the root of the project run:
```
Poetry install --no-root
```
Then:
```
eval $(poetry env activate)
```


## Run server
Use command:
```
invoke server
```
this runs the backend and frontend servers simultaniously using threading.
To run one or the other, decorators --backend and --frontend can be used.
```
invoke server --frontend
```


## Tests
To run unit tests use command:
```
invoke test
```
to run robot tests use command:
```
invoke robot
```


## Lint
Linting for can be done using command:
```
invoke lint
```
This affects backend/ and frontend/ folders.
To lint one or the other, decorators --backend and --frontend can be used.
```
invoke lint --frontend
```