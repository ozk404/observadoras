import { test } from "node:test";
import assert from "node:assert/strict";
import { AI_CONSENT_VERSION, permitsInitialAnalysis } from "../src/lib/consent";
import { publicSubmission } from "../src/server/reports";
test("new submissions require the current notice; known past AI consent remains scoped to analysis", () => {
  const input = {description:"Relato ficticio suficientemente largo para el formulario.", consent:true, website:"", token:"fixture", submissionKey:crypto.randomUUID(), consentVersion:AI_CONSENT_VERSION};
  assert.equal(publicSubmission.safeParse(input).success,true);
  for(const consentVersion of [undefined,"2026-10-26-reports-v1","forged"])
    assert.equal(publicSubmission.safeParse({...input,consentVersion}).success,false);
  assert.equal(permitsInitialAnalysis(AI_CONSENT_VERSION),true);
  assert.equal(permitsInitialAnalysis("2026-10-26-reports-v1"),true);
  assert.equal(permitsInitialAnalysis(null),false);
  assert.equal(permitsInitialAnalysis("forged"),false);
});
