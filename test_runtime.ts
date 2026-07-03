import { registerController, loginController } from './server/auth/index';
import { Request, Response } from 'express';

async function testAuthLogic() {
  console.log("🧪 Testing Auth Logic Runtime...");
  
  const mockRes = {
    status: (code: number) => ({
      json: (data: any) => {
        console.log(\`[Response \${code}]\`, data);
        return mockRes;
      }
    }),
    json: (data: any) => {
      console.log("[Response 200]", data);
      return mockRes;
    }
  } as unknown as Response;

  const mockReq = {
    body: {
      email: "test@moataz.ai",
      password: "password123",
      name: "Test User"
    }
  } as Request;

  try {
    console.log("1. Testing Register (Logic only)...");
    // We expect this to fail or succeed depending on DB connectivity in sandbox
    // The goal is to check if the code runs without syntax/runtime errors
    await registerController(mockReq, mockRes);
    
    console.log("2. Testing Login (Logic only)...");
    await loginController(mockReq, mockRes);
    
    console.log("✅ Runtime logic check passed.");
  } catch (e: any) {
    console.error("❌ Runtime logic check failed:", e.message);
  }
}

testAuthLogic();
