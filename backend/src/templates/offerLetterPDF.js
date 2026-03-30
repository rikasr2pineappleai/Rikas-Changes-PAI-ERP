const generateOfferLetterHTML = (data) => {
  const {
    employeeName,
    address,
    position,
    department,
    joiningDate,
    endDate,
    location,
    letterDate,
    reportingManager,
    reportingManagerEmail,
    responsibilities,
    generatedBy
  } = data;

  const responsibilityList = responsibilities
    ? responsibilities
        .split("\n")
        .filter(r => r.trim())
        .map(r => `<li>${r.trim()}</li>`)
        .join("")
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<style>
body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  margin: 40px;
  color: #000;
}

.section-title {
  font-weight: bold;
  margin-top: 15px;
}

ul {
  margin-left: 20px;
}

p {
  margin: 8px 0;
}
</style>
</head>

<body>

<!-- Date -->
<p>${letterDate || new Date().toLocaleDateString("en-GB")}</p>

<br/>

<!-- Name & Address -->

<p>
<strong>${employeeName || "[Name]"}</strong><br/>
${address || "[Address]"}
</p>

<br/>

<!-- Greeting -->

<p>Dear ${employeeName || "[Name]"},</p>

<br/>

<!-- Intro -->

<p>
We are delighted to extend an internship opportunity at PineappleAI within our
${department || "[Department]"} department as a
${position || "[Position]"}.
Your background and interest in this field have caught our attention,
and we are confident that your skills will benefit our team.
</p>

<br/>

<!-- Position Info -->

<p class="section-title">Position</p>

<ul>
  <li>Title : ${position || "-"}</li>
  <li>Start Date : ${joiningDate || "-"}</li>
  <li>End Date : ${endDate || "-"}</li>
  <li>Location : ${location || "Hybrid"}</li>
</ul>

<br/>

<!-- Terms -->

<p class="section-title">Terms of Internship</p>

<ul>
  <li>Your work schedule will be 40 hours per week, 5 days a week from 7.00 AM to 4.00 PM.</li>
  <li>A service letter will be provided upon successful completion of the internship.</li>
  <li>Two months written notice is required prior to resignation.</li>
</ul>

<br/>

<!-- Responsibilities -->

<p class="section-title">Responsibilities</p>

<ul>
  ${responsibilityList}
</ul>

<br/>

<!-- Expectations -->

<p class="section-title">Expectations</p>

<ul>
  <li>Demonstrate professionalism and punctuality.</li>
  <li>Communicate effectively with team members.</li>
  <li>Protect confidential company information.</li>
  <li>Follow company policies and standards.</li>
</ul>

<br/>

<!-- Leave -->

<p class="section-title">Leave</p>

<ul>
  <li>Leave requests must be approved by your reporting manager.</li>
  <li>Maximum of 14 days annual leave per year.</li>
  <li>Unapproved absences may affect evaluation.</li>
</ul>

<br/>

<!-- Reporting -->

<p class="section-title">Reporting</p>

<p>
You will be reporting to
<strong>${reportingManager || "Your Supervisor"}</strong>
${reportingManagerEmail ? `(${reportingManagerEmail})` : ""}.
Please communicate regularly and seek guidance when required.
</p>

<br/>

<!-- Closing -->

<p>
We are excited to welcome you to our team and look forward to working with you.
Congratulations on your selection.
</p>

<p>
If you have any questions, please contact us at
<strong>ceo@pineappleai.cloud</strong>.
</p>

<br/>

<!-- Signature -->

<p>Sincerely,</p>

<p>
<strong>${generatedBy || "Nishany Seyoon"}</strong><br/>
Chief HR Operational Officer<br/>
ceo@pineappleai.cloud
</p>

</body>
</html>
`;
};

module.exports = { generateOfferLetterHTML };