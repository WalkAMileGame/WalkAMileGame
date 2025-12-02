# Walk A Mile Game
[![GHA workflow Badge](https://github.com/WalkAMileGame/WalkAMileGame/workflows/CI/badge.svg)](https://github.com/WalkAMileGame/WalkAMileGame/actions)
[![codecov](https://codecov.io/gh/WalkAMileGame/WalkAMileGame/graph/badge.svg?token=J0JPV9UMQ6)](https://codecov.io/gh/WalkAMileGame/WalkAMileGame)

Walk A Mile Game is a interactive game where players can step in to the shoes of an international students moving aboard. In the game players use energy to complete required tasks. 
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


### Run server
Use command:
```
invoke server
```
this runs the backend and frontend servers simultaniously using threading.
To run one or the other, decorators --backend and --frontend can be used.
```
invoke server --frontend
```


### Tests
To run unit and e2e tests use command:
```
invoke test
```


### Lint
Linting for can be done using command:
```
invoke lint
```
This affects backend/ and frontend/ folders.
To lint one or the other, decorators --backend and --frontend can be used.
```
invoke lint --frontend
```

More detailed instrustions [here](https://github.com/WalkAMileGame/WalkAMileGame/wiki/Local-Development)
Problems with installation? See this [document](https://github.com/WalkAMileGame/WalkAMileGame/wiki/Common-problems)

## Dev practices & Documentation
[Local developement and dev practices](https://github.com/WalkAMileGame/WalkAMileGame/wiki/Documentation) <br>
## Architecture
[Project Architecture](https://github.com/WalkAMileGame/WalkAMileGame/wiki/Architecture) <br>
## Backlogs
[Sprint Backlog](https://docs.google.com/spreadsheets/d/1A6qgzNF7eFwW12SikSRkp7DugFDTFNgHiJknRVjrA_E/edit?usp=sharing)

[Product Backlog](https://github.com/orgs/WalkAMileGame/projects/1/views/1)

