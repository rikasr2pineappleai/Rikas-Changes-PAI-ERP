/**
 * INTERNSHIP OFFER LETTER TEMPLATE
 * FINAL FIXED VERSION
 * - Perfect A4 Alignment
 * - Reduced unwanted gaps
 * - Background image support
 * - Puppeteer PDF Ready
 * - Professional spacing
 */

const fs = require('fs');
const path = require('path');

/* ------------------------------------------------ */
/* BACKGROUND IMAGE */
/* ------------------------------------------------ */

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

/* ------------------------------------------------ */
/* HELPERS */
/* ------------------------------------------------ */

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

/* ------------------------------------------------ */
/* MAIN TEMPLATE */
/* ------------------------------------------------ */

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

  /* RESPONSIBILITIES */

  const responsibilityList = responsibilities
    ? responsibilities
        .split('\n')
        .filter(r => r.trim())
        .map(r => `<div>• ${esc(r.trim())}</div>`)
        .join('')
    : `
        <div>• Enter the start and end times of work into the system.</div>
        <div>• Attend meetings on time.</div>
        <div>• Send daily update emails before sign off.</div>
      `;

  return `
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8" />

<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<title>Internship Offer Letter</title>

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

        /* PERFECT A4 POSITION */

        top:130px;

        left:95px;

        right:65px;

        bottom:90px;

        color:#111;

        font-size:12.5px;

        line-height:1.38;
    }

    .date{
        margin-bottom:12px;
    }

    .name{
        margin-bottom:3px;
    }

    .address{
        margin-bottom:14px;
    }

    .paragraph{
        margin-bottom:10px;
        text-align:justify;
    }

    .section-title{

        font-weight:bold;

        margin-top:10px;

        margin-bottom:5px;
    }

    .details{
        margin-bottom:10px;
    }

    .details div{
        margin-bottom:2px;
    }

    .list{

        margin-left:14px;

        margin-bottom:10px;
    }

    .list div{

        margin-bottom:3px;

        text-align:justify;
    }

    .signature{
        margin-top:16px;
    }

    .signature-name{

        margin-top:10px;

        line-height:1.35;
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

        <div class="date">
            ${formatDate(letterDate) || '[DATE]'}
        </div>

        <div class="name">
            ${esc(employeeName || '[NAME]')}
        </div>

        <div class="address">
            ${esc(address || '[ADDRESS]')}
        </div>

        <div class="paragraph">
            Dear ${esc(employeeName || '[NAME]')},
        </div>

        <div class="paragraph">

            We are delighted to extend an internship opportunity at

            <strong>PineappleAI</strong>

            within our

            <strong>${esc(department || 'IT')}</strong>

            department as a

            <strong>${esc(position || '[Role]')}</strong>.

            Your background and evident passion for this role
            have caught our attention, and we are confident that
            your skills and enthusiasm will greatly benefit our team.

        </div>

        <div class="details">

            <div>
                <strong>Position:</strong>
                ${esc(position || '[Role]')}
            </div>

            <div>
                <strong>Start Date:</strong>
                ${formatDate(joiningDate) || '[Date of Joining]'}
            </div>

            <div>
                <strong>End Date:</strong>
                ${formatDate(endDate) || '[Date of Ending]'}
            </div>

            <div>
                <strong>Location:</strong>
                ${esc(location || 'Hybrid')}
            </div>

        </div>

        <div class="section-title">
            Terms of Internship
        </div>

        <div class="paragraph">

            Your work schedule will be 40 hours per week,
            5 days of the week from 7.00 AM to 4.00 PM.

        </div>

        <div class="paragraph">

            A service letter will be provided upon successful
            completion of a 12-month internship term.

        </div>

        <div class="paragraph">

            During the internship, interns must provide at least
            two months' notice in writing before their intended
            departure date.

        </div>

        <div class="section-title">
            Responsibilities
        </div>

        <div class="paragraph">
            During your internship, you will have the responsibility to:
        </div>

        <div class="list">

            ${responsibilityList}

        </div>

        <div class="section-title">
            Expectations
        </div>

        <div class="list">

            <div>
                • Demonstrate professionalism and punctuality in all interactions.
            </div>

            <div>
                • Communicate effectively with team members and supervisors.
            </div>

            <div>
                • Be proactive in seeking feedback and learning opportunities.
            </div>

            <div>
                • Maintain confidentiality regarding sensitive company information.
            </div>

            <div>
                • You can be terminated at any time if company policies are violated.
            </div>

        </div>

        <div class="section-title">
            Leave
        </div>

        <div class="paragraph">

            Please send an email approving the leave request
            to your Reporty, and remember to CC HR.

        </div>

        <div class="paragraph">

            During the internship period, employees are permitted
            to take a maximum of half a day off per month.

        </div>

        <div class="paragraph">

            After the internship, employees are entitled to
            7 casual leaves, 14 sick leaves, 14 annual leaves,
            and all government-declared holidays per year.

        </div>

        <div class="paragraph">

            Please ensure all leave requests are approved by
            Reportee, with HR CC'd. Unapproved absences may
            impact your internship evaluation.

        </div>

        <div class="section-title">
            Reporting
        </div>

        <div class="paragraph">

            You will be reporting to

            <strong>
                ${esc(reportingManager || 'S. Lakshan (CEO)')}
            </strong>

            at

            <span class="email">
                ${esc(reportingManagerEmail || 'ceo@pineappleai.cloud')}
            </span>,

            who will oversee your work and provide guidance
            throughout your internship.

        </div>

        <div class="paragraph">

            Your Reporty will be available to answer any questions
            you may have and provide support as needed.

        </div>

        <div class="paragraph">

            Please review this offer letter carefully and indicate
            your acceptance by signing and returning the enclosed
            copy within one week.

        </div>

        <div class="paragraph">

            If you have any questions or concerns, please do not hesitate
            to contact us at

            <span class="email">
                ceo@pineappleai.cloud
            </span>

        </div>

        <div class="paragraph">

            We are excited to welcome you to our team and look
            forward to working with you.

            Congratulations on your internship offer!

        </div>

        <div class="signature">

            Sincerely,

        </div>

        <div class="signature-name">

            ${esc(generatedBy || 'Nishany Seyoon')}<br>

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
  generateOfferLetterHTML
};