# Level question files

`levelNN.json` holds one level's questions (`LevelRegistry` → `stimulusFile`). It uses the same
schema as `../questionsv2.json`: `{ "questions": [ ... ] }`. Copy one question from there to start.

The template menu creates each file with an empty list. While a file is empty or missing, the
level plays Level 1's `questionsv2.json` and logs a warning.

This folder ships with the WebGL build (everything in StreamingAssets does). This README is a
few hundred bytes.
