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


## Tests
To run all tests use command:
```
invoke test
```

## Lint
Linting for can be dune using command:
```
invoke lint
```
This affects backend/ and frontend/ folders.
To lint one or the other, decorators --backend and --frontend can be used.
```
invoke lint --frontend
```