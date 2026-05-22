/**
 * SERVICE LETTER HTML TEMPLATE
 * A4 Fixed Layout + Background Template + Puppeteer Ready
 */

const fs = require('fs');
const path = require('path');

/* ---------------------------------------------------- */
/* LOAD BACKGROUND IMAGE */
/* ---------------------------------------------------- */

const BACKGROUND_IMAGE_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'frontend',
  'src',
  'assets',
  'images',
  'background template.png'
);

const backgroundBase64 = fs
  .readFileSync(BACKGROUND_IMAGE_PATH)
  .toString('base64');

/* ---------------------------------------------------- */
/* HELPERS */
/* ---------------------------------------------------- */

const esc = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatDate = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return value;
  }

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  return `${dd}.${mm}.${yyyy}`;
};

/* ---------------------------------------------------- */
/* MAIN TEMPLATE */
/* ---------------------------------------------------- */

const generateServiceLetterHTML = (data) => {

  const employeeName = data.employeeName || 'Name';

  const designation = data.position || 'Designation';

  const role = data.department || 'Role';

  const letterDate =
    formatDate(data.letterDate) || 'DD.MM.YYYY';

  const startDate =
    formatDate(data.joiningDate) || 'Start Date';

  const endDate =
    formatDate(data.endDate) || 'End Date';

  const generatedBy =
    data.generatedBy || 'Thileksana Suntharamouleegan';

  /* RESPONSIBILITIES */

  const responsibilities = String(
    data.responsibilities || ''
  )
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean);

  const responsibilitiesHtml = responsibilities.length
    ? responsibilities
        .map(
          (r, i) => `
            <div>
              ${i + 1}. ${esc(r)}
            </div>
          `
        )
        .join('')
    : `
        <div>
          1. Additional responsibility
        </div>
      `;

  /* RETURN HTML */

  return `
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8" />

<title>Service Letter</title>

<style>

    *{
        margin:0;
        padding:0;
        box-sizing:border-box;
    }

    @page{
        size:A4;
        margin:0;
    }

    html,body{

        width:210mm;
        height:297mm;

        font-family:"Times New Roman", serif;

        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;

        background:#ffffff;
    }

    body{
        margin:0;
        padding:0;
    }

    /* PAGE */

    .page{

        position:relative;

        width:210mm;
        height:297mm;

        overflow:hidden;

        background-image:url("data:image/png;base64,${backgroundBase64}");

        background-size:100% 100%;

        background-repeat:no-repeat;
    }

    /* CONTENT */

    .content{

        position:absolute;

        top:155px;

        left:74px;

        right:60px;

        color:#111;

        font-size:14px;

        line-height:1.58;
    }

    .title{

        font-size:16px;

        font-weight:bold;

        margin-bottom:18px;
    }

    .date{
        margin-bottom:22px;
    }

    .paragraph{

        margin-bottom:16px;

        text-align:justify;
    }

    .list{

        margin-left:18px;

        margin-bottom:18px;
    }

    .list div{

        margin-bottom:4px;

        text-align:justify;
    }

    .signature{

        margin-top:24px;
    }

    .signature-name{

        margin-top:18px;

        line-height:1.5;
    }

    .email{

        color:#0a58ca;

        text-decoration:underline;
    }

    strong{
        font-weight:bold;
    }

</style>

</head>

<body>

<div class="page">

    <div class="content">

        <div class="title">
            Service Letter
        </div>

        <div class="date">
            [${esc(letterDate)}]
        </div>

        <div class="paragraph">
            Dear ${esc(employeeName)},
        </div>

        <div class="paragraph">

            This letter is to confirm that

            <strong>${esc(employeeName)}</strong>

            has successfully completed an internship at

            <strong>PineappleAI</strong>

            from ${esc(startDate)}

            to ${esc(endDate)}

            as a

            ${esc(designation)} ${esc(role)}.

        </div>

        <div class="paragraph">

            During their tenure,

            ${esc(employeeName)}

            was responsible for:

        </div>

        <div class="list">

            ${responsibilitiesHtml}

        </div>

        <div class="paragraph">

            Throughout their tenure,

            ${esc(employeeName)}

            demonstrated strong technical expertise in frontend and backend
            development, problem-solving abilities, and a commitment to
            delivering high-quality mobile and web applications.

        </div>

        <div class="paragraph">

            Their ability to collaborate with cross-functional teams,
            optimize application performance, and implement best coding
            practices made them a valuable asset to our organization.

            We appreciate their contributions and wish them success
            in their future endeavors.

        </div>

        <div class="paragraph">

            Please feel free to contact us at

            ceo@pineappleai.cloud

        </div>

        <div class="paragraph">

            We wish ${esc(employeeName)}

            all the best in their future endeavors.

        </div>

        <div class="signature">

            Sincerely,

        </div>

        <div class="signature-name">

            ${esc(generatedBy)}<br>

            Chief HR Operational Officer<br>

            <span class="email">
                ceo@pineappleai.cloud
            </span>

        </div>

    </div>

</div>

</body>

</html>
`;
};

module.exports = {
  generateServiceLetterHTML,
  formatDate
};