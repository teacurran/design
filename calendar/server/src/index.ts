import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.get("/calendar", (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  
  // Generate a simple SVG
  const svg = `
  <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="100" height="100" stroke="black" fill="transparent" stroke-width="5"/>
      <circle cx="160" cy="140" r="50" stroke="green" fill="transparent" stroke-width="4"/>
      <text x="10" y="190" font-family="Arial" font-size="20" fill="blue">Hello SVG</text>
  </svg>`;

  res.send(svg);
});


app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});