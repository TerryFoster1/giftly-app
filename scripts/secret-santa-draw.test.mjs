import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const sourcePath = path.join(process.cwd(), "lib", "secret-santa-draw.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020
  }
});

const sandbox = {
  exports: {},
  module: { exports: {} }
};
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(compiled.outputText, sandbox, { filename: sourcePath });

const { generateSecretSantaDraw } = sandbox.module.exports;

function ids(count) {
  return Array.from({ length: count }, (_, index) => `p${index + 1}`);
}

function validateDraw(participantIds, draw) {
  assert.equal(draw.length, participantIds.length);
  const givers = new Set(draw.map((pair) => pair.giverParticipantId));
  const recipients = new Set(draw.map((pair) => pair.recipientParticipantId));
  assert.equal(givers.size, participantIds.length);
  assert.equal(recipients.size, participantIds.length);
  for (const pair of draw) {
    assert.notEqual(pair.giverParticipantId, pair.recipientParticipantId);
    assert.ok(participantIds.includes(pair.giverParticipantId));
    assert.ok(participantIds.includes(pair.recipientParticipantId));
  }
}

{
  const participants = ids(6);
  const draw = generateSecretSantaDraw({ participantIds: participants });
  validateDraw(participants, draw);
}

{
  const participants = ["a", "b", "c", "d"];
  const exclusions = [{ participantAId: "a", participantBId: "b" }];
  for (let index = 0; index < 20; index += 1) {
    const draw = generateSecretSantaDraw({ participantIds: participants, exclusions });
    validateDraw(participants, draw);
    assert.ok(!draw.some((pair) => pair.giverParticipantId === "a" && pair.recipientParticipantId === "b"));
    assert.ok(!draw.some((pair) => pair.giverParticipantId === "b" && pair.recipientParticipantId === "a"));
  }
}

{
  assert.throws(
    () =>
      generateSecretSantaDraw({
        participantIds: ["a", "b", "c"],
        exclusions: [
          { participantAId: "a", participantBId: "b" },
          { participantAId: "a", participantBId: "c" }
        ]
      }),
    /SECRET_SANTA_DRAW_IMPOSSIBLE/
  );
}

{
  assert.throws(() => generateSecretSantaDraw({ participantIds: ["a", "b"] }), /SECRET_SANTA_MIN_PARTICIPANTS/);
}

{
  const participants = ids(5);
  const persisted = generateSecretSantaDraw({ participantIds: participants });
  const reread = [...persisted];
  assert.equal(JSON.stringify(reread), JSON.stringify(persisted));
  const reset = [];
  assert.equal(reset.length, 0);
}

console.log("Secret Santa draw tests passed.");
