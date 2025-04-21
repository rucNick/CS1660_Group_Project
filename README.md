# CS1660 Final Project
Nick Cao, Maggie Lin, Kate Fierens, Ben, Satvvik

TLDR/Getting Started, Description of the service, Architectual diagram, Roadmap/next steps of the project, and any additional information about your implementation

## TL;DR
This is a QR attendance app, using the cloud run and CI/CD assignments as a jumping off point with a similar tech stack. In addition to the usual suspects, there is a Java Springboot auth backend.

## Service Description
Professors can use a QRcode that contains a link with a unique class ID tag pinned on the app's url. The student or professor can then scan the QR code and be taken to the landing page for that class. They can sign in and either check in as a student, or view the attendance record as the professor. 

The app is deployed on Cloud Run, and performs auth and data storage through GCP as well.

## Architectural Diagram

## Next Steps
To get the app into a better spot, there are a few improvements that could stand to be made.
1) Implement a way for professors to register and be verified as such so only they can see attendance records.
2) Allow professors to upload a class list and associated emails, so that only a registered student with their school email can check in.
3) Give the professors a way to organize students by attendance or given them sort of attedance chart visualization.
4) Allow the student to view their own attendance for the class.
