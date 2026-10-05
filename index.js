const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();
const fs = require("fs");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function generateChunk(chunk, chunkNumber, totalChunks) {

  const prompt = `
  You are an expert web accessibility developer.

Improve the following existing webpage HTML for Blind and Visually Impaired
(BVI) users who use screen readers.

Use WCAG 2.2 Level A and AA as the accessibility framework.

Focus on:
1. Semantic HTML
2. Heading structure
3. Image alternative text
4. Meaningful link names
5. Navigation landmarks
6. Form labels
7. Reading order
8. Appropriate ARIA attributes

IMPORTANT:
- Preserve all meaningful existing content.
- Preserve existing links and their destinations.
- Do not invent factual information.
- Do not remove meaningful information.
- Do not change the meaning of the content.
- Do not return Markdown or explanations.
So the score has obviously increased after the website regeneration. It went from 5.7 to 7.4 something. But because we have given it a prompt saying to fix this specific only, I think we are limiting scope and not letting it to do its work in full potential. So can I just ask it to do under the Y2.2 and not give any other specifically features to work with.

  

This is chunk ${chunkNumber} of ${totalChunks}.
Process this chunk independently.

HTML CHUNK:

${chunk}
`;
  for (let attempt = 1; attempt <= 3; attempt++) {

    try {

      console.log(
        `Gemini: processing chunk ${chunkNumber}/${totalChunks} - attempt ${attempt}`
      );

      const result = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt
      });

      let output = result.text;

      // Remove Markdown code fences if Gemini adds them
      output = output
        .replace(/^```html\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "");

      console.log(`Chunk ${chunkNumber} completed successfully.`);

      return output;

    } catch (error) {

      console.log(
        `Chunk ${chunkNumber} attempt ${attempt} failed.`
      );

      if (attempt === 3) {
        throw error;
      }

      console.log("Waiting 30 seconds before retrying...");

      await new Promise(resolve =>
        setTimeout(resolve, 30000)
      );
    }
  }
}


async function main() {

  // --------------------------------------------------
  // 1. Read original webpage
  // --------------------------------------------------

  console.log("Reading original webpage...");

  const html = fs.readFileSync("original.html", "utf8");


  // --------------------------------------------------
  // 2. Extract body
  // --------------------------------------------------

  const bodyMatch = html.match(/<body[\s\S]*?<\/body>/i);

  if (!bodyMatch) {
    throw new Error("Could not find the webpage body.");
  }

  const bodyHTML = bodyMatch[0];

  console.log("Total body characters:", bodyHTML.length);


  // --------------------------------------------------
  // 3. Split HTML into chunks
  // --------------------------------------------------

  const chunkSize = 20000;

  const chunks = [];

  for (let i = 0; i < bodyHTML.length; i += chunkSize) {

    chunks.push(
      bodyHTML.slice(i, i + chunkSize)
    );

  }

  console.log("Total chunks:", chunks.length);


  // --------------------------------------------------
  // 4. Process every chunk
  // --------------------------------------------------

  const processedChunks = [];

  for (let i = 0; i < chunks.length; i++) {

    const processed = await generateChunk(
      chunks[i],
      i + 1,
      chunks.length
    );

    processedChunks.push(processed);

  }


  // --------------------------------------------------
  // 5. Combine all processed chunks
  // --------------------------------------------------

  console.log("Combining processed chunks...");

  const regeneratedBody = processedChunks.join("\n");


  // --------------------------------------------------
  // 6. Save the regenerated HTML
  // --------------------------------------------------

  const regeneratedHTML = `
<!DOCTYPE html>

<html lang="en">

<head>

  <meta charset="UTF-8">

  <title>AI Regenerated Accessible Webpage</title>

</head>

<body>

${regeneratedBody}

</body>

</html>
`;


  fs.writeFileSync(
    "gemini-prompt3-specific.html",
    regeneratedHTML
  );


  console.log("");
  console.log("=================================");
  console.log("Accessibility regeneration complete!");
  console.log("Saved as gemini-prompt3-specific.html");
  console.log("=================================");

}


main().catch(error => {

  console.error("ERROR:");
  console.error(error);

});