# Master Plan For the Project

The consumer assistance program helps Colorado consumers who have had insurance claims denied appeal the decisions and recover funds. 

[Current website summary page](https://cohealthinitiative.org/cap/)

[Current get help page](https://cohealthinitiative.org/need-help/)

The current website is a simple form submit to begin the process and notify the staff. 

This project will replace the current website with a react application frontend that collects the same info and is presented in a similar but better style. Then the collected intake forms can be used to begin a CRM like process for handling the case and use a backend system to autmoate some steps. 

## Frontend 
Begin with this. Create a static react frontend that can be hosted on s3. It should be inspired by the current website and use the images but be designed more for the user. 
Use tailwind for the css. Include existing imagery and branding from the webiste. Here is a color inspo 
* primary #01599a
* secondary #7aabdb
* highlight #fec524
All the components should be dumb.
This needs to be mobile compatible.

The new site should retain the approachable, nonprofit/community-oriented character of the current CAP site while substantially improving clarity, accessibility, and task completion.

### Expected Pages 
`/how-we-help` mostly informational like the current summary page 
`/intake` to act as the current `/need-help` page 
After the intake landing page users shoudl be able to click to start a new intake this should direct them to 
`/instake/id` with a unique id for the intake. Use formik all information in a single form. Implement with custom input components, buttons, and any needed hooks. This will present a multistep form:
1. Zip code. Users can skip the zip code. If the zip code is entered, it should autofill address information stored within the frontend. 
1. Language select english or spanish with a flag.  
1. Name and email and address using the autofilled info from above. Only needs to support US.
1. Documents these should be stored in s3

Ensure there is a footer to proceed and return between steps. The intake should not persist. Until a backend is made the subsmission should just generate an email. 

### Additional best practices 
Decide on details to support all the following 
#### Define responsive/mobile behavior

This is especially important for this project because people seeking help with medical bills may very well be completing the form on a phone.

Specify:

Mobile-first layout
Minimum tap target sizes
Sticky/fixed navigation or not
Form fields full width on mobile
How progress is displayed
How errors are displayed
Whether tables/cards collapse
Image treatment

I would make mobile completion of the intake form a first-class requirement, not an afterthought.

#### Define accessibility requirements

For a healthcare-assistance service, this deserves its own section.

At minimum:

WCAG 2.2 AA target
Keyboard navigation
Screen-reader labels
Visible focus states
Appropriate error messaging
Never rely on color alone
Sufficient contrast
Accessible dialogs
Proper semantic headings
Large enough controls
Form errors associated with the relevant field

Also decide whether accessibility testing is part of the acceptance criteria.

#### Define loading/error/empty/success states

Every data-dependent action should have:

idle
loading
success
error

For the intake process, specifically define:

submission failure
network interruption
duplicate submission
server validation failure
session expiration
successful submission

The success screen should tell the user what happens next, rather than simply saying "Thank you."

That maps nicely to the real CAP workflow, where staff subsequently contact the consumer and may request authorization and documents

#### Content independent of components 
Where practical 
```` typescript
const helpPageContent = {
  title: "...",
  intro: "...",
  sections: [...]
}
````

#### Security
This is particularly important because the intake contains potentially sensitive healthcare and insurance information.

The frontend spec should explicitly state:

No sensitive data in URL parameters
No sensitive data in analytics
No sensitive data in client logs
HTTPS only
How authentication/session state works, if applicable
Whether document uploads occur in this application
Whether the frontend talks directly to the API or through another layer
What third-party analytics/scripts are permitted

## Infrastructure 
Plan aws infrastructure to support this system. The frontend should be hosted statically on s3 with the public `cap-frontend-590251390266-us-east-2-an` bucket accessed with cloudfront. There should be a lambda function for the API which should log to cloudwatch. 

## API
[Implementation plan](./api-implementation.md)
### Form is submitted with 

``` powershell
Invoke-WebRequest -UseBasicParsing -Uri "https://secure.everyaction.com/v2/Forms/jl7xMCgglkipe-xsRW1AMg2" `
-Method "POST" `
-UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:154.0) Gecko/20100101 Firefox/154.0" `
-Headers @{
"Accept" = "*/*"
  "Accept-Language" = "en-US,en;q=0.9"
  "Accept-Encoding" = "gzip, deflate, br, zstd"
  "Origin" = "https://cohealthinitiative.org"
  "Sec-Fetch-Storage-Access" = "none"
  "Referer" = "https://cohealthinitiative.org/"
  "Sec-Fetch-Dest" = "empty"
  "Sec-Fetch-Mode" = "cors"
  "Sec-Fetch-Site" = "cross-site"
  "Pragma" = "no-cache"
  "Cache-Control" = "no-cache"
  "TE" = "trailers"
} `
-ContentType "application/x-www-form-urlencoded; charset=UTF-8" `
-Body "FirstName=test&LastName=test&PreferredLanguages=62&AddressLine1=1565+N+Raleigh+St+306&PostalCode=80204&City=DENVER&EmailAddress=test%40test.com&HomePhoneCountryCode=us&HomePhoneInternationalDialingPrefix=1&HomePhone=3033333333&YesSignMeUpForUpdatesForBinder=true&CustomFormFieldQuestion_7775419738964799=test&CustomFormFieldQuestion_191236437614073_CustomFormFieldQuestion_8308097974681773=false&CustomFormFieldQuestion_191236437614073_CustomFormFieldQuestion_7444239866455935=true&CustomFormFieldQuestion_109184367424359_CustomFormFieldQuestion_8944715872682445=true&CustomFormFieldQuestion_109184367424359_CustomFormFieldQuestion_1197857230065095=false&CustomFormFieldQuestion_109184367424359_CustomFormFieldQuestion_2750002287485161=false&FormVersion=12%2F10%2F2024+6%3A54%3A59+PM%7C&type=SignupForm&FormSessionId=8bb5b7b7-0451-47ff-b231-1097ab3bcc90&ClientSubmissionId=202e5fc2-86f0-4f71-87bd-71156b57de41&BrowserName=firefox&DeviceType=desktop&XFromApp=ActionTag&ActionTagBaseUrl=https%3A%2F%2Fstatic.everyaction.com%2Fea-actiontag%2F"
```

Will need to implement a system for calling the real API or calling a local mock of the API using environment varaibles.

### Form open 
```powershell
Invoke-WebRequest -UseBasicParsing -Uri "https://secure.everyaction.com/v1/Forms/jl7xMCgglkipe-xsRW1AMg2" `
-UserAgent "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:154.0) Gecko/20100101 Firefox/154.0" `
-Headers @{
"Accept" = "application/json, text/javascript, */*; q=0.01"
  "Accept-Language" = "en-US,en;q=0.9"
  "Accept-Encoding" = "gzip, deflate, br, zstd"
  "Origin" = "https://cohealthinitiative.org"
  "Sec-Fetch-Storage-Access" = "none"
  "Referer" = "https://cohealthinitiative.org/"
  "Sec-Fetch-Dest" = "empty"
  "Sec-Fetch-Mode" = "cors"
  "Sec-Fetch-Site" = "cross-site"
  "Pragma" = "no-cache"
  "Cache-Control" = "no-cache"
}
```
Response 
```json
{
  "tenantDisplayName":"ngpvan://van/EA/EA017/1/115055",
  "submissionUrl":"https://secure.everyaction.com/v2/Forms/jl7xMCgglkipe-xsRW1AMg2",
  "autoFastAction":false,
  "created":"2024-09-18 21:08:01Z",
  "formVersion":"12/10/2024 6:54:59 PM|",
  "fastAction":false,
  "form_elements":[{"name":"HeaderHtml","type":"markup","markup":"<h1><u>Need Help?</u></h1>\n\n<p>CCHI's Consumer Assistance Program helps Coloradans who experience issues with their health coverage. We can help you navigate hospital financial assistance programs, surprise medical bills, health care denials, claims issues, and negotiating payment plans with doctors, clinics, hospitals and collections agencies. We can also refer you to health coverage enrollment assistance and to other basic needs programs like food and energy assistance. Please complete this inquiry form and we will contact you.</p>\n"},{"name":"submitForm","type":"submit","value":"Submit"},{"name":"ContactInformation","type":"fieldset","title":"Contact Information","children":[{"name":"FirstName","type":"textfield","title":"First Name","queryString":"fn","required":true,"maxlength":20},{"name":"LastName","type":"textfield","title":"Last Name","queryString":"ln","required":true,"maxlength":25},{"name":"PreferredLanguages","type":"select","title":"Preferred Language","queryString":"prefLang","required":true,"options":[{"value":"62","display":"Amharic"},{"value":"63","display":"Arabic"},{"value":"22","display":"Armenian"},{"value":"111","display":"ASL"},{"value":"1","display":"Bengali"},{"value":"72","display":"Bhutanese"},{"value":"68","display":"Bosnian"},{"value":"42","display":"Bulgarian"},{"value":"43","display":"Burmese"},{"value":"2","display":"Cantonese"},{"value":"73","display":"Chamorro"},{"value":"69","display":"Creole"},{"value":"64","display":"Croatian"},{"value":"116","display":"Czech"},{"value":"60","display":"Danish"},{"value":"37","display":"Dutch"},{"value":"3","display":"English"},{"value":"45","display":"Estonian"},{"value":"121","display":"Filipino"},{"value":"47","display":"Finnish"},{"value":"4","display":"French"},{"value":"26","display":"German"},{"value":"38","display":"Greek"},{"value":"5","display":"Gujarati"},{"value":"50","display":"Hebrew"},{"value":"6","display":"Hindi"},{"value":"67","display":"Hmong"},{"value":"39","display":"Hungarian"},{"value":"48","display":"Icelandic"},{"value":"74","display":"Ilocano"},{"value":"49","display":"Indonesian"},{"value":"28","display":"Italian"},{"value":"119","display":"Iu Mien"},{"value":"7","display":"Japanese"},{"value":"80","display":"Kannada"},{"value":"75","display":"Karenni"},{"value":"113","display":"Khmer"},{"value":"8","display":"Korean"},{"value":"51","display":"Lao"},{"value":"52","display":"Latvian"},{"value":"53","display":"Lithuanian"},{"value":"88","display":"Malay"},{"value":"9","display":"Malayalam"},{"value":"10","display":"Mandarin"},{"value":"81","display":"Marathi"},{"value":"11","display":"Nepali"},{"value":"36","display":"Norwegian"},{"value":"112","display":"Not Listed"},{"value":"30","display":"Polish"},{"value":"55","display":"Portuguese"},{"value":"12","display":"Punjabi"},{"value":"13","display":"Russian"},{"value":"32","display":"Samoan"},{"value":"70","display":"Serbian"},{"value":"115","display":"Simplified Chinese"},{"value":"120","display":"Sinhala"},{"value":"123","display":"Slovak"},{"value":"65","display":"Somali"},{"value":"15","display":"Spanish"},{"value":"78","display":"Swahili"},{"value":"31","display":"Swedish"},{"value":"16","display":"Tagalog"},{"value":"17","display":"Tamil"},{"value":"57","display":"Thai"},{"value":"18","display":"Tibetan"},{"value":"66","display":"Tigrinya"},{"value":"79","display":"Tokelauan"},{"value":"122","display":"Traditional Chinese"},{"value":"58","display":"Turkish"},{"value":"71","display":"Ukranian"},{"value":"19","display":"Urdu"},{"value":"20","display":"Vietnamese"}],"allowMultipleValues":true},{"name":"AddressLine1","type":"textfield","title":"Street Address","queryString":"add1","required":false,"maxlength":99},{"name":"City","type":"textfield","title":"City","queryString":"ci","required":true,"maxlength":25},{"name":"PostalCode","type":"textfield","title":"Zip Code","queryString":"pc","required":true,"maxlength":10,"validation":"postalCode"},{"name":"HomePhone","type":"textfield","title":"Home Phone","default_country_code":"US","queryString":"hp","required":true,"validation":"phone","options":"table_countries"},{"name":"MobilePhone","type":"textfield","title":"Mobile Phone","default_country_code":"US","queryString":"mp","required":false,"validation":"phone","options":"table_countries"},{"name":"EmailAddress","type":"textfield","title":"Email","queryString":"em","required":true,"maxlength":100,"validation":"email"},{"name":"YesSignMeUpForUpdatesForBinder","type":"checkbox","title":"Yes, sign me up for email updates.","default_value":true,"queryString":"ae","required":false},{"name":"PersonalUrl","type":"textfield","queryString":"PersonalUrl","required":false},{"name":"SocialNetworkTrackingId","type":"hidden","queryString":"ref"},{"name":"SocialNetwork","type":"hidden","queryString":"snw"},{"name":"TrackingPixel","type":"markup","markup":"<img alt='' src='https://secure.everyaction.com/v1/Track/jl7xMCgglkipe-xsRW1AMg2' style='display:none'/>"}]},{"name":"AdditionalInformation","type":"fieldset","title":"Additional Information","children":[{"name":"CustomFormFieldQuestion_7775419738964799","type":"textfield","title":"How did you hear about CCHI?","queryString":"CustomFormFieldQuestion_7775419738964799","required":true,"maxlength":75},{"name":"CustomFormFieldQuestion_191236437614073","type":"checkbox-list-manager","title":"If you speak a language other than English or Spanish, would you like us to arrange for an interpreter? An interpreter isn't needed if you speak Spanish.","queryString":"CustomFormFieldQuestion_191236437614073","required":true},{"name":"CustomFormFieldQuestion_191236437614073_CustomFormFieldQuestion_8308097974681773","type":"checkbox","title":"Yes","default_value":false,"queryString":"CustomFormFieldQuestion_8308097974681773","required":false},{"name":"CustomFormFieldQuestion_191236437614073_CustomFormFieldQuestion_7444239866455935","type":"checkbox","title":"No","default_value":false,"queryString":"CustomFormFieldQuestion_7444239866455935","required":false},{"name":"CustomFormFieldQuestion_109184367424359","type":"checkbox-list-manager","title":"Preferred Contact Method","queryString":"CustomFormFieldQuestion_109184367424359","required":true},{"name":"CustomFormFieldQuestion_109184367424359_CustomFormFieldQuestion_8944715872682445","type":"checkbox","title":"Phone","default_value":false,"queryString":"CustomFormFieldQuestion_8944715872682445","required":false},{"name":"CustomFormFieldQuestion_109184367424359_CustomFormFieldQuestion_1197857230065095","type":"checkbox","title":"Text Message","default_value":false,"queryString":"CustomFormFieldQuestion_1197857230065095","required":false},{"name":"CustomFormFieldQuestion_109184367424359_CustomFormFieldQuestion_2750002287485161","type":"checkbox","title":"Email","default_value":false,"queryString":"CustomFormFieldQuestion_2750002287485161","required":false}]}],
  "formId":2023965,
  "metadata":{"layoutStyle":"standard","displayConfirmationMessage":true,"deactivationHtmlContent":"<img alt='' src='https://secure.everyaction.com/v1/Track/jl7xMCgglkipe-xsRW1AMg2' style='display:none'/>","columns":1,"payPalClientId":"","payPalMerchantId":"","isUsOnly":"True","tenantUri":"ngpvan://van/EA/EA017/1/115055","sourceCodeId":1101021,"clientAmountFormatting":true,"options":{"table_countries":[{"value":"US","display":"United States"}]},"isStripeJsEnabled":false},
  "status":"Published",
  "title":"CAP Inquiry Form",
  "name":"CAP Inquiry Form",
  "type":"SignupForm",
  "updated":"2024-12-10 18:54:59Z",
  "url":{"full":"https://secure.everyaction.com/v1/Forms/jl7xMCgglkipe-xsRW1AMg2","base":"https://secure.everyaction.com/","slug":""},
  "shortCode":"jl7xMCgglkipe-xsRW1AMg2"
}
```

### File storage 
Uploaded files should be stored in s3. Presigned URLs should be generated by the API and then the file should be PUT by the webclient. 

## React native 
In addition to the web app the repo should support a react native build for eventual shipping to the app stores 

