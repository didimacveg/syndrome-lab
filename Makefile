# One command reproduces everything: `make all`. Use SCALE=0.01 for a fast smoke run.
PY ?= python3
SCALE ?= 1.0
WORKERS ?= 4

.PHONY: all test baseline train evaluate capacity web figures report content clean-results serve

all: test baseline train evaluate capacity web figures report

test:
	$(PY) -m pytest tests -q
	@if [ -f tests_js/fixtures.json ]; then node tests_js/test_qec.js; fi

baseline:
	$(PY) scripts/baseline.py --scale $(SCALE)

train:
	$(PY) scripts/train_circuit.py --workers $(WORKERS) --scale $(SCALE)

evaluate:
	for d in 3 5 7; do $(PY) scripts/evaluate.py --d $$d --scale $(SCALE) --threads $(WORKERS); done

capacity:
	$(PY) scripts/train_capacity.py --scale $(SCALE)

web:
	$(PY) scripts/export_web.py
	node scripts/find_cases.js
	node tests_js/test_qec.js

figures:
	$(PY) scripts/figures.py

report: figures
	$(PY) scripts/build_report.py

content:
	$(PY) scripts/make_content.py

serve:
	$(PY) -m http.server 8000 --directory web

clean-results:
	rm -f results/*.json models/*.pt models/*.json models/*.onnx models/*.ckpt
