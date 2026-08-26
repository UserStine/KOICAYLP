import test from "node:test";
import assert from "node:assert/strict";
import { lexicalScores } from "../rag.js";
const chunks=[
  {id:"application",title:"Application process",category:"application",text:"Download the application form and submit the completed documents."},
  {id:"eligibility",title:"Eligibility",category:"eligibility",text:"Applicants must meet the age and experience criteria."},
  {id:"tracks",title:"Programme tracks",category:"tracks",text:"Public sector and private sector participants follow different tracks."},
];
const top=(q)=>chunks[lexicalScores(q,chunks).map((score,i)=>({score,i})).sort((a,b)=>b.score-a.score)[0].i].id;
test("English application query ranks application knowledge",()=>assert.equal(top("How do I apply?"),"application"));
test("French application query expands to application knowledge",()=>assert.equal(top("Comment soumettre ma candidature et le formulaire ?"),"application"));
test("Korean track query expands to track knowledge",()=>assert.equal(top("공공 부문과 민간 부문 트랙의 차이는 무엇인가요?"),"tracks"));
