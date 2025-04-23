# CS1660 Final Project
Nick Cao, Maggie Lin, Kate Fierens, Ben Radovic, Satvvik Taandon <br>
https://qr-attendance-1043677821736.us-central1.run.app/

## TL;DR
This is a QR attendance app, using the cloud run and CI/CD assignments as a jumping off point with a similar tech stack. In addition to the usual suspects, there is a Java Springboot auth backend.

## Service Description
The app is deployed on Cloud Run, and performs auth and data storage through GCP as well. The diagram below best describes the app, however a brief verbal description may be warranted. The GitHub Actions workflow triggers every time code is pushed to the codebase; builds, dockerizes, and pushes the image to the Artifactory. Once manually deployed, the site can be reached at its base url. Once signed in and authenticated, the user must choose their role and for which class they are teaching or attending. Students are then redirected to a page where they can check in as an attendee of that class with an associated timestamp. If the user is a professor, they can view an attendance record of their class. 

## Architectural Diagram
![image](https://github.com/user-attachments/assets/59acd0df-1107-4cd7-987e-0ccc86eb8f1c)

## IAM Roles
![image](https://github.com/user-attachments/assets/b3800c5f-8ffa-4786-868f-243db760f948)

## Next Steps
To get the app into a better spot, there are a few improvements that could stand to be made.
1) Implement a way for professors to register and be verified as such so only they can see attendance records.
2) Allow professors to upload a class list and associated emails, so that only a registered student with their school email can check in.
3) Give the professors a way to organize students by attendance or given them sort of attedance chart visualization.
4) Allow the student to view their own attendance for the class.
