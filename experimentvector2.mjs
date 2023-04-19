// Import required packages
const { Client } = require("pg");
// TODO unfortunately, sentence-transformers is a python library
const { SentenceTransformer } = require("sentence-transformers");

// Set up the PostgreSQL client
const client = new Client({
  connectionString: "your_postgresql_connection_string"
});

// Initialize the sentence transformer model
const model = new SentenceTransformer("distilbert-base-nli-mean-tokens");

async function storeEmbeddings(input) {
  // Connect to the PostgreSQL database
  await client.connect();

  // Generate vector embeddings for the input string
  const embeddings = await model.encode([input]);

  // Store the embeddings in the PostgreSQL database
  const query = "INSERT INTO embeddings (input_string, vector) VALUES ($1, $2)";
  await client.query(query, [input, embeddings[0]]);

  // Close the PostgreSQL connection
  await client.end();
}

async function findKNearestNeighbors(input, k = 5) {
  // Connect to the PostgreSQL database
  await client.connect();

  // Generate vector embeddings for the input string
  const embeddings = await model.encode([input]);

  // Perform a k-nearest neighbor search for the input string
  const query = `
    SELECT input_string
    FROM embeddings
    ORDER BY cosine_similarity(vector, $1) DESC
    LIMIT $2
  `;

  const result = await client.query(query, [embeddings[0], k]);

  // Close the PostgreSQL connection
  await client.end();

  // Output relevant strings from the original input
  console.log(
    "Similar strings:",
    result.rows.map(row => row.input_string)
  );
}

(async () => {
  const input1 = "This is an example input string.";
  const input2 = "Another similar input string to compare.";

  await storeEmbeddings(input1);
  await findKNearestNeighbors(input2);
})();
