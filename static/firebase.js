/**
 * This is the client-side code that interacts with Firebase Auth to sign in users, updates the UI if the user is signed in,
 * and sends the user's vote to the server.
 *
 * When running on localhost, you can disable authentication by passing `auth=false` as a query parameter.
 *
 * NOTE: YOU ONLY NEED TO MODIFY THE VOTE FUNCTION AT THE BOTTOM OF THIS FILE.
 */
firebase.initializeApp(config);

function initApp() {
  firebase.auth().onAuthStateChanged(user => {
    const signInButton = document.getElementById('signInButton');
    const checkInButton = document.getElementById('checkIn');
    const viewAttendanceButton = document.getElementById('viewAttendance');
    if (user) {
      signInButton.innerText = 'Sign Out';
      document.getElementById('bodyInfo').style.display = '';

      const urlParams = new URLSearchParams(window.location.search);
      const role = urlParams.get('role');
      const courseId = urlParams.get("courseId");

      if (role === 'Professor') {
        checkInButton.style.display = 'none';
        viewAttendanceButton.style.display = 'block';
        viewAttendanceButton.addEventListener("click", function () {
          viewAttendance(courseId);
        });
      } else if (role === 'Student') {
        viewAttendanceButton.style.display = 'none';
        checkInButton.style.display = 'block';
      }
    } else {
      signInButton.innerText = 'Sign In with Google';
      document.getElementById('bodyInfo').style.display = 'none';
    }
  });
}

function authDisabled() {
  const urlParams = new URLSearchParams(window.location.search);
  const hostname = window.location.hostname;
  return urlParams.get('auth') === 'false' && hostname === 'localhost';
}

async function createIdToken() {
  if (authDisabled()) {
    console.warn('Auth is disabled. Returning dummy ID token.');
    return new Promise(resolve =>
      resolve('dummyToken'));
  } else {
    return await firebase.auth().currentUser.getIdToken();
  }
}

window.onload = function () {
  if (authDisabled()) {
    console.warn('Running with auth disabled.');
    document.getElementById('signInButton').innerText = '(Auth Disabled)';
    document.getElementById('form').style.display = '';
  } else {
    console.log('Running with auth enabled.');
    initApp();
  }
};

function signIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/userinfo.email');

  firebase
  .auth()
  .signInWithPopup(provider)
  .then(result => {
      console.log(`${result.user.displayName} logged in.`);
      window.alert(`Welcome ${result.user.displayName}!`);

      const modal = M.Modal.getInstance(document.getElementById('roleCourseModal'));
      modal.open();

      document.getElementById("submitRoleCourse").onclick = async () => {
        const role = document.getElementById("roleSelect").value;
        const course = document.getElementById("courseSelect").value;

        if (!role || !course) {
          window.alert("Please select a role and a course.");
          return;
        }

        const url = new URL(window.location.href);
        url.searchParams.set("courseId", course);
        url.searchParams.set("role", role);
        history.replaceState(null, "", url.toString());

        modal.close();
        window.alert(`Role: ${role}, Course: ${course} selected`);

        initApp();
      };
  })
  .catch(err => {
    console.log(`Sign in error: ${err.message}`);
    window.alert(`Sign in failed.`);
  });
}   

function signOut() {
  firebase
    .auth()
    .signOut()
    .catch(err => {
      console.log(`Sign out error: ${err.message}`);
      window.alert(`Sign out failed.`);
    });
}

function toggle() {
  if (authDisabled()) {
    window.alert('Auth is disabled.');
    return;
  }
  if (!firebase.auth().currentUser) {
    signIn();
  } else {
    signOut();
  }
}

function showConfirmation(name, timestamp, courseId) {
  const dateCheckedIn = new Date(timestamp);
  const container = document.getElementById("confirmationContainer");
  container.innerHTML = `
    <span style="font-size: 5rem;">✅</span>
    <h5>Attendance Confirmed</h5>
    <p><strong>${name}</strong> checked into ${courseId} on <em>${dateCheckedIn.toLocaleDateString()}</em></p>
  `;
}

async function checkIn() {
  console.log(`Checking in for...`);
  if (firebase.auth().currentUser || authDisabled()) {
    // Retrieve JWT to identify the user to the Identity Platform service.
    // Returns the current token if it has not expired. Otherwise, this will
    // refresh the token and return a new one.
    try {
      const token = await createIdToken();

      /*
       * ++++ YOUR CODE HERE ++++
       */
      const formData = new URLSearchParams();
      const user = firebase.auth().currentUser;

      
      const params = new URLSearchParams(window.location.search);
      const courseId = params.get("courseId");
      const role = params.get("role");

      if (!courseId) {
        window.alert("Please select a course first.");
        return;
      }

      const name = user.displayName;
      formData.append('name', name);
      const uid = user.uid;
      formData.append('uid', uid);
      formData.append('courseId', courseId);
      formData.append("role", role);

      const response = await fetch('/attend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`
        },
        body: formData.toString()
      });

      if (response.ok) {
        window.alert("Attendance marked successfully!");
        showConfirmation(name, Date.now(), courseId, role);
      }

    } catch (err) {
      console.log(`Error when checking in: ${err}`);
      window.alert('Something went wrong... Please try again!');
    }
  } else {
    window.alert('User not signed in.');
  }
}

async function viewAttendance(courseId) {
  if (firebase.auth().currentUser || authDisabled()) {
    try {
      const token = await createIdToken();

      if (!courseId) {
        window.alert('Course ID is required.');
        return;
      }

      const role = 'Professor'; 

      const response = await fetch('/attend', {
        method: "GET",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const html = await response.text();
        document.getElementById("attendance-container").innerHTML = html;
        document.getElementById("attendance-container").style.display = "block";
      } else {
        const errorData = await response.json();
        window.alert(`Failed! ${errorData.error}`);
      }
    } catch (err) {
      console.log(`Error when viewing attendance: ${err}`);
      window.alert('Something went wrong... Please try again!');
    }
  } else {
    window.alert('User not signed in.');
  }
}


