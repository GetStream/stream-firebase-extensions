"use strict";

const assert = require("node:assert/strict");
const {after, test} = require("node:test");
const Module = require("node:module");
const firebaseFunctionsTest = require("firebase-functions-test");

const fft = firebaseFunctionsTest({
  projectId: "demo-stream",
});

function loadFunctionsWithMock(mockClient) {
  process.env.STREAM_API_KEY = "test-key";
  process.env.STREAM_API_SECRET = "test-secret";

  const originalLoad = Module._load;
  const indexPath = require.resolve("../lib/index.js");

  delete require.cache[indexPath];

  Module._load = function(request, parent, isMain) {
    if (request === "firebase-admin") {
      return {
        initializeApp() {},
      };
    }

    if (request === "stream-chat") {
      return {
        StreamChat: {
          getInstance() {
            return mockClient;
          },
        },
      };
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    return require(indexPath);
  } finally {
    Module._load = originalLoad;
  }
}

after(() => {
  fft.cleanup();
});

test("createStreamUser upserts the mapped Stream user", async () => {
  const calls = [];
  const mockResponse = {created: true};
  const functionsModule = loadFunctionsWithMock({
    async upsertUser(user) {
      calls.push(user);
      return mockResponse;
    },
    async deleteUser() {
      throw new Error("deleteUser should not be called");
    },
    createToken() {
      throw new Error("createToken should not be called");
    },
    revokeUserToken() {
      throw new Error("revokeUserToken should not be called");
    },
  });

  const wrapped = fft.wrap(functionsModule.createStreamUser);
  const userRecord = fft.auth.makeUserRecord({
    uid: "user-123",
    displayName: "John Doe",
    email: "user@example.com",
    photoURL: "https://example.com/johndoe.jpg",
  });

  const response = await wrapped(userRecord);

  assert.deepStrictEqual(calls, [
    {
      id: "user-123",
      name: "John Doe",
      email: "user@example.com",
      image: "https://example.com/johndoe.jpg",
    },
  ]);
  assert.deepStrictEqual(response, mockResponse);
});

test("createStreamUser surfaces Stream client failures", async () => {
  const expectedError = new Error("Stream unavailable");
  const functionsModule = loadFunctionsWithMock({
    async upsertUser() {
      throw expectedError;
    },
    async deleteUser() {
      throw new Error("deleteUser should not be called");
    },
    createToken() {
      throw new Error("createToken should not be called");
    },
    revokeUserToken() {
      throw new Error("revokeUserToken should not be called");
    },
  });

  const wrapped = fft.wrap(functionsModule.createStreamUser);
  const userRecord = fft.auth.makeUserRecord({
    uid: "user-123",
  });

  await assert.rejects(wrapped(userRecord), expectedError);
});

test("deleteStreamUser deletes the mapped Stream user", async () => {
  const calls = [];
  const mockResponse = {deleted: true};
  const functionsModule = loadFunctionsWithMock({
    async upsertUser() {
      throw new Error("upsertUser should not be called");
    },
    async deleteUser(userId) {
      calls.push(userId);
      return mockResponse;
    },
    createToken() {
      throw new Error("createToken should not be called");
    },
    revokeUserToken() {
      throw new Error("revokeUserToken should not be called");
    },
  });

  const wrapped = fft.wrap(functionsModule.deleteStreamUser);
  const userRecord = fft.auth.makeUserRecord({
    uid: "user-123",
  });

  const response = await wrapped(userRecord);

  assert.deepStrictEqual(calls, ["user-123"]);
  assert.deepStrictEqual(response, mockResponse);
});
