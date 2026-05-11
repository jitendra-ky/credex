import '@testing-library/jest-dom';

// Ensure Response is available for Next.js API route testing
if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = class Response {
    constructor(body, init) {
      this.body = body;
      this.init = init;
    }
    
    static json(body, init) {
      return new Response(JSON.stringify(body), {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
      });
    }
    
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
    
    get status() {
      return this.init?.status || 200;
    }
  };
}
