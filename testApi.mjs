async function test() {
  try {
    const formData = new FormData();
    formData.append("jobDescription", "Senior Frontend Developer");
    const blob = new Blob(["dummy resume content for testing"], { type: "application/pdf" });
    formData.append("resume", blob, "test.pdf");

    const res = await fetch("http://localhost:3000/api/generate-pathway", {
      method: "POST",
      body: formData
    });

    const status = res.status;
    const text = await res.text();
    console.log("STATUS:", status);
    console.log("RESPONSE:", text.substring(0, 1000));
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
