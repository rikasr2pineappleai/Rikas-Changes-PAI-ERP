const generateServiceLetterHTML = (data) => {
  const {
    employeeName,
    position,
    joiningDate,
    endDate,
    letterDate,
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

.title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
}

.date {
  margin-bottom: 15px;
}

.content p {
  margin: 12px 0;
}

ol {
  margin-left: 20px;
}
</style>
</head>

<body>

<!-- Title -->
<div class="title">Service Letter</div>

<!-- Date -->
<div class="date">
  ${letterDate || "[Date]"}
</div>

<!-- Content -->

<div class="content">

<p>Dear ${employeeName || "[Name]"},</p>

<p>
This letter is to confirm that <strong>${employeeName || "[Name]"}</strong>
has successfully completed an internship at
<strong>PineappleAI</strong> from
<strong>${joiningDate || "[Date of Joining]"}</strong> to
<strong>${endDate || "[Date of Ending]"}</strong>
as a <strong>${position || "[Designation, Role]"}</strong>.
</p>

<p>
During their tenure, ${employeeName || "[Name]"} was responsible for:
</p>

<ol>
  ${responsibilityList}
</ol>

<p>
Throughout their tenure, ${employeeName || "[Name]"} demonstrated strong technical
expertise in frontend and backend development, problem-solving abilities, and a
commitment to delivering high-quality applications.
</p>

<p>
They played a key role in designing, developing, and maintaining scalable
applications.
</p>

<p>
Their ability to collaborate with cross-functional teams, optimize performance,
and follow best coding practices made them a valuable asset to our organization.
</p>

<p>
We appreciate their contributions and wish them success in their future endeavors.
Please feel free to contact us at <strong>ceo@pineappleai.cloud</strong>.
</p>

<p>
We wish ${employeeName || "[Name]"} all the best in future endeavors.
</p>

<br/>

<p>Sincerely,</p>

<p>
<strong>${generatedBy || "Thileksana Suntharamouleeagan"}</strong><br/>
Chief HR Operational Officer<br/>
ceo@pineappleai.cloud
</p>

</div>

</body>
</html>
`;
};

module.exports = { generateServiceLetterHTML };