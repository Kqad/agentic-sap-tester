// Custom Playwright reporter that emits structured events to stdout so the
// run server can recognize them, strip them out of the user-visible console
// log, and broadcast them over the WebSocket as live status updates for the
// step preview UI.
//
// Wire format (one line per event):
//   ##SAPEVT## {"type":"step","phase":"begin","title":"Step 1: ...",...}
//
// The marker prefix is unique enough that we never confuse it with regular
// stdout from the spec or other reporters (list / midscene). The run server
// peeks at every output line, intercepts these, and re-emits them as
// {type:'event', event:{...}} WS messages.
//
// Only `test.step` category steps are emitted — we ignore hooks, expects,
// and the noisy pw:api category.

function emit(payload) {
  try {
    process.stdout.write('##SAPEVT## ' + JSON.stringify(payload) + '\n');
  } catch { /* swallow — stdio errors shouldn't fail the test */ }
}

class StepEventReporter {
  // Tell Playwright we use stdout so it doesn't redirect us.
  printsToStdio() { return true; }

  onBegin(_config, _suite) {
    emit({ type: 'session', phase: 'begin', ts: Date.now() });
  }

  onTestBegin(test) {
    emit({
      type: 'test',
      phase: 'begin',
      title: test.title,
      location: test.location ? { file: test.location.file, line: test.location.line } : null,
      ts: Date.now(),
    });
  }

  onStepBegin(_test, _result, step) {
    if (step.category !== 'test.step') return;
    emit({
      type: 'step',
      phase: 'begin',
      title: step.title,
      line: step.location ? step.location.line : null,
      parentTitle: step.parent ? step.parent.title : null,
      ts: Date.now(),
    });
  }

  onStepEnd(_test, _result, step) {
    if (step.category !== 'test.step') return;
    emit({
      type: 'step',
      phase: 'end',
      title: step.title,
      line: step.location ? step.location.line : null,
      parentTitle: step.parent ? step.parent.title : null,
      durationMs: step.duration,
      status: step.error ? 'failed' : 'passed',
      errorMessage: step.error && step.error.message ? step.error.message : null,
      ts: Date.now(),
    });
  }

  onTestEnd(test, result) {
    emit({
      type: 'test',
      phase: 'end',
      title: test.title,
      status: result.status,
      durationMs: result.duration,
      errorMessage: result.error && result.error.message ? result.error.message : null,
      ts: Date.now(),
    });
  }

  onError(error) {
    emit({
      type: 'fatal',
      errorMessage: error && error.message ? error.message : String(error),
      ts: Date.now(),
    });
  }

  onEnd(result) {
    emit({
      type: 'session',
      phase: 'end',
      status: result ? result.status : null,
      ts: Date.now(),
    });
  }
}

module.exports = StepEventReporter;
module.exports.default = StepEventReporter;
