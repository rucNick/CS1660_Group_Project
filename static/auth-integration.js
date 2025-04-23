// Store original Firebase methods as fallbacks
const originalSignIn = signIn;
const originalSignOut = signOut;
const originalCheckIn = checkIn;
const originalViewAttendance = viewAttendance;

// Define the AuthServer URL
const AUTH_SERVER_URL = "http://localhost:8080";

// Override signIn function to use AuthServer
signIn = async function() {
  // First use Firebase for Google Auth
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/userinfo.email');

  try {
    const result = await firebase.auth().signInWithPopup(provider);
    console.log(`${result.user.displayName} logged in with Firebase.`);
    
    // Now register/login with AuthServer
    const idToken = await result.user.getIdToken();
    
    // Call AuthServer to register the Google user - with updated CORS settings
    const response = await fetch(`${AUTH_SERVER_URL}/api/auth/google/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      mode: 'cors',
      credentials: 'same-origin', // Changed from 'include' to 'same-origin'
      body: JSON.stringify({
        googleId: result.user.uid,
        email: result.user.email,
        fullName: result.user.displayName
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to authenticate with server');
    }
    
    const authData = await response.json();
    console.log('AuthServer login response:', authData);
    
    // Store the user info in localStorage
    localStorage.setItem('authUser', JSON.stringify({
      userId: authData.userId || result.user.uid,
      email: authData.email || result.user.email,
      fullName: authData.fullName || result.user.displayName,
      role: authData.role,
      roleAssigned: authData.roleAssigned
    }));
    
    // If role is not assigned, show role selection modal
    if (!authData.roleAssigned) {
      window.alert(`Welcome ${result.user.displayName}! Please select your role.`);
      
      const modal = M.Modal.getInstance(document.getElementById('roleCourseModal'));
      modal.open();

      document.getElementById("submitRoleCourse").onclick = async () => {
        const role = document.getElementById("roleSelect").value;
        const course = document.getElementById("courseSelect").value;
        
        if (!role || !course) {
          window.alert("Please select a role and a course.");
          return;
        }

        // Call AuthServer to assign role - with updated CORS settings
        const roleResponse = await fetch(`${AUTH_SERVER_URL}/api/auth/role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          mode: 'cors',
          credentials: 'same-origin', // Changed from 'include' to 'same-origin'
          body: JSON.stringify({
            userId: authData.userId || result.user.uid,
            role: role
            // Let the server generate studentId if needed
          })
        });
        
        if (!roleResponse.ok) {
          throw new Error('Failed to assign role');
        }
        
        const roleResult = await roleResponse.json();
        console.log('Role assignment result:', roleResult);
        
        // Update stored user info
        localStorage.setItem('authUser', JSON.stringify({
          userId: roleResult.userId,
          email: roleResult.email,
          fullName: roleResult.fullName,
          role: roleResult.role,
          roleAssigned: true
        }));

        // Update URL with role and course
        const url = new URL(window.location.href);
        url.searchParams.set("courseId", course);
        url.searchParams.set("role", role);
        history.replaceState(null, "", url.toString());

        modal.close();
        window.alert(`Role: ${role}, Course: ${course} selected`);

        // Update UI based on authentication
        updateAuthUI();
      };
    } else {
      window.alert(`Welcome back, ${result.user.displayName}!`);
      
      // Set URL parameters based on stored role
      const url = new URL(window.location.href);
      url.searchParams.set("role", authData.role);
      history.replaceState(null, "", url.toString());
      
      // Update UI based on authentication
      updateAuthUI();
    }
    
  } catch (err) {
    console.error('Authentication error:', err);
    window.alert(`Sign in failed: ${err.message}`);
  }
};

// Override signOut function to use AuthServer
signOut = async function() {
  try {
    // Call AuthServer logout - with updated CORS settings
    await fetch(`${AUTH_SERVER_URL}/api/auth/logout`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'same-origin' // Changed from 'include' to 'same-origin'
    });
    
    // Clear local storage
    localStorage.removeItem('authUser');
    
    // Also log out from Firebase
    await firebase.auth().signOut();
    
    console.log('Successfully logged out');
    window.alert('You have been logged out');
    
    // Update UI based on authentication
    updateAuthUI(false);
    
  } catch (err) {
    console.error('Logout error:', err);
    window.alert(`Sign out failed: ${err.message}`);
  }
};

// Function to handle email/password login
async function loginUser() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  
  if (!email || !password) {
    window.alert("Please fill in all fields");
    return;
  }
  
  try {
    const response = await fetch(`${AUTH_SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      credentials: 'same-origin',
      body: JSON.stringify({
        email: email,
        password: password
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Login failed");
    }
    
    const userData = await response.json();
    console.log('Login successful:', userData);
    
    // Store user data
    localStorage.setItem('authUser', JSON.stringify({
      userId: userData.userId,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      roleAssigned: !userData.needsRoleAssignment
    }));
    
    // Close modal
    const loginModal = M.Modal.getInstance(document.getElementById('loginModal'));
    loginModal.close();
    
    // If role is not assigned, show role selection modal
    if (userData.needsRoleAssignment) {
      const modal = M.Modal.getInstance(document.getElementById('roleCourseModal'));
      modal.open();
      
      document.getElementById("submitRoleCourse").onclick = async function() {
        const role = document.getElementById("roleSelect").value;
        const course = document.getElementById("courseSelect").value;
        const userId = userData.userId || localStorage.getItem('pendingUserId');
        
        if (!role || !course) {
          window.alert("Please select a role and a course.");
          return;
        }
        
        if (!userId) {
          window.alert("User ID not found. Please try logging in again.");
          return;
        }
        
        try {
          // Create a minimal payload with just the essential fields
          const roleData = {
            userId: userId,
            role: role.toLowerCase()
          };
          
          console.log("Sending simplified role data:", roleData);
          
          // Make the API call with simple payload
          const roleResponse = await fetch(`${AUTH_SERVER_URL}/api/auth/role`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'same-origin',
            body: JSON.stringify(roleData)
          });
          
          // Get full response for debugging
          let responseText = "";
          try {
            responseText = await roleResponse.text();
            console.log("Complete server response:", responseText);
          } catch (e) {
            console.error("Could not read response text:", e);
          }
          
          if (!roleResponse.ok) {
            console.error(`Server error (${roleResponse.status}): ${responseText}`);
            throw new Error(`Role assignment failed with status ${roleResponse.status}`);
          }
          
          // Parse the response with fallback
          let roleResult = {};
          try {
            roleResult = JSON.parse(responseText);
            console.log('Parsed role assignment result:', roleResult);
          } catch (e) {
            console.warn("Could not parse response as JSON, using default values");
            roleResult = { 
              userId: userId,
              role: role.toLowerCase()
            };
          }
          
          // Store user information in localStorage
          const userInfo = {
            userId: userId,
            email: userData ? userData.email : "",
            fullName: userData ? userData.fullName : "",
            role: role.toLowerCase(),
            roleAssigned: true,
            courseId: course
          };
          
          // Add role-specific data
          if (role.toLowerCase() === "student") {
            userInfo.enrolledCourses = [course];
          } else if (role.toLowerCase() === "professor") {
            userInfo.teachingCourses = [course];
          }
          
          localStorage.setItem('authUser', JSON.stringify(userInfo));
          localStorage.removeItem('pendingUserId'); // Clean up if it was used
          
          // Update URL with role and course
          const url = new URL(window.location.href);
          url.searchParams.set("courseId", course);
          url.searchParams.set("role", role.toLowerCase());
          history.replaceState(null, "", url.toString());
          
          // Close the modal
          const modal = M.Modal.getInstance(document.getElementById('roleCourseModal'));
          modal.close();
          
          window.alert(`Role: ${role}, Course: ${course} assigned successfully!`);
          
          // Update UI and reload page
          updateAuthUI(true);
          
          // Small delay before reload to ensure state is saved
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } catch (err) {
          console.error('Role assignment error:', err);
          
          // Store locally even if server request fails
          const userInfo = {
            userId: userId,
            email: userData ? userData.email : "",
            fullName: userData ? userData.fullName : "",
            role: role.toLowerCase(),
            roleAssigned: true,
            courseId: course
          };
          
          // Add role-specific data
          if (role.toLowerCase() === "student") {
            userInfo.enrolledCourses = [course];
          } else if (role.toLowerCase() === "professor") {
            userInfo.teachingCourses = [course];
          }
          
          localStorage.setItem('authUser', JSON.stringify(userInfo));
          localStorage.removeItem('pendingUserId'); // Clean up if it was used
          
          // Update URL
          const url = new URL(window.location.href);
          url.searchParams.set("courseId", course);
          url.searchParams.set("role", role.toLowerCase());
          history.replaceState(null, "", url.toString());
          
          // Close the modal
          const modal = M.Modal.getInstance(document.getElementById('roleCourseModal'));
          modal.close();
          
          window.alert(`⚠️ Server error when assigning role, but your selection has been saved locally. You can continue using the app.`);
          
          // Update UI anyway and reload
          updateAuthUI(true);
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      };
    } else {
      window.alert(`Welcome back, ${userData.fullName}!`);
      
      // Update URL with role
      const url = new URL(window.location.href);
      url.searchParams.set("role", userData.role);
      history.replaceState(null, "", url.toString());
      
      // Update UI based on authentication
      updateAuthUI();
      
      // Reload page
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
    
  } catch (err) {
    console.error('Login error:', err);
    window.alert(`Login failed: ${err.message}`);
  }
}
// Function to register a new user
async function registerUser() {
  const fullName = document.getElementById("register-fullName").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const role = document.getElementById("register-role").value;
  
  // Get course selection based on role
  let courses = [];
  if (role === "Student") {
    const studentClassesSelect = document.getElementById("student-classes");
    if (studentClassesSelect && studentClassesSelect.selectedOptions) {
      courses = Array.from(studentClassesSelect.selectedOptions).map(option => option.value);
    }
  } else if (role === "Professor") {
    const professorClassesSelect = document.getElementById("professor-classes");
    if (professorClassesSelect && professorClassesSelect.selectedOptions) {
      courses = Array.from(professorClassesSelect.selectedOptions).map(option => option.value);
    }
  }
  
  if (!fullName || !email || !password || !role || courses.length === 0) {
    window.alert("Please fill in all required fields and select at least one course");
    return;
  }
  
  try {
    // First register the user
    const registerResponse = await fetch(`${AUTH_SERVER_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      credentials: 'same-origin',
      body: JSON.stringify({
        fullName: fullName,
        email: email,
        password: password
      })
    });
    
    if (!registerResponse.ok) {
      const errorData = await registerResponse.json();
      throw new Error(errorData.error || "Registration failed");
    }
    
    const userData = await registerResponse.json();
    console.log('Registration successful:', userData);
    
    // Close the registration modal
    const registerModal = M.Modal.getInstance(document.getElementById('registerModal'));
    registerModal.close();
    
    // Directly assign role without showing the role selection modal again
    const roleData = {
      userId: userData.userId,
      role: role.toLowerCase()
    };
    
    // Add student ID if role is student
    if (role.toLowerCase() === "student") {
      roleData.studentId = "STU-" + Math.floor(10000 + Math.random() * 90000);
    }
    
    console.log("Sending role data directly:", roleData);
    
    // Use direct API endpoint
    const roleResponse = await fetch(`${AUTH_SERVER_URL}/api/auth/role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      credentials: 'same-origin',
      body: JSON.stringify({
        userId: authData.userId || result.user.uid,
        role: role.toLowerCase() // Make sure role is lowercase to match server expectations
      })
    });
    
    // Add better error handling
    if (!roleResponse.ok) {
      const errorText = await roleResponse.text();
      console.error("Role assignment error response:", errorText);
      throw new Error(`Failed to assign role: ${errorText}`);
    }
    
    // Even if role assignment fails, proceed with local data
    let roleResult = {};
    if (roleResponse.ok) {
      roleResult = await roleResponse.json();
      console.log('Role assignment successful:', roleResult);
    }
    
    // Store user data including course selection
    localStorage.setItem('authUser', JSON.stringify({
      userId: userData.userId,
      email: userData.email,
      fullName: userData.fullName,
      role: role.toLowerCase(),
      roleAssigned: true,
      courses: courses,
      courseId: courses[0] // Use first course as current course
    }));
    
    window.alert(`Registration successful! Welcome, ${fullName}! You are registered as a ${role} for ${courses.join(", ")}`);
    
    // Update URL with role and course
    const url = new URL(window.location.href);
    url.searchParams.set("courseId", courses[0]);
    url.searchParams.set("role", role.toLowerCase());
    history.replaceState(null, "", url.toString());
    
    // Update UI
    updateAuthUI(true);
    
    // Reload the page
    setTimeout(() => {
      window.location.reload();
    }, 500);
    
  } catch (err) {
    console.error('Registration error:', err);
    window.alert(`Registration failed: ${err.message}`);
  }
}

// Helper function to handle role selection
async function handleRoleSelection(userId) {
  const role = document.getElementById("roleSelect").value;
  const course = document.getElementById("courseSelect").value;
  
  if (!role || !course) {
    window.alert("Please select a role and a course.");
    return;
  }
  
  try {
    // Create role data object
    const roleData = {
      userId: userId,
      role: role.toLowerCase()
    };
    
    // Add role-specific data
    if (role.toLowerCase() === "student") {
      // For students, use the course as their enrolled class
      roleData.studentId = "STU-" + Math.floor(10000 + Math.random() * 90000);
      roleData.enrolledCourses = [course]; // Single course for now
    } else if (role.toLowerCase() === "professor") {
      // For professors, we could get multiple courses, but for now just use the primary course
      roleData.courses = [course]; // This could be expanded to include multiple courses
    }
    
    console.log("Sending role data:", roleData);
    
    // Use the direct API endpoint
    const roleResponse = await fetch(`${AUTH_SERVER_URL}/api/auth/role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors',
      credentials: 'same-origin',
      body: JSON.stringify(roleData)
    });
    
    if (!roleResponse.ok) {
      // Try to get error message from response
      let errorMessage = "Role assignment failed";
      try {
        const errorData = await roleResponse.text();
        console.error("Server error response:", errorData);
        errorMessage += ": " + errorData;
      } catch (e) {
        // If we can't read the error, just use the status
        errorMessage += ` with status ${roleResponse.status}`;
      }
      throw new Error(errorMessage);
    }
    
    const roleResult = await roleResponse.json();
    console.log('Role assignment result:', roleResult);
    
    // Update stored user info
    localStorage.setItem('authUser', JSON.stringify({
      userId: roleResult.userId || userId,
      email: roleResult.email,
      fullName: roleResult.fullName,
      role: roleResult.role || role.toLowerCase(),
      roleAssigned: true,
      primaryCourse: course,
      courses: role.toLowerCase() === "professor" ? [course] : [],
      enrolledCourses: role.toLowerCase() === "student" ? [course] : []
    }));
    
    // Update UI with role and course
    const url = new URL(window.location.href);
    url.searchParams.set("courseId", course);
    url.searchParams.set("role", role.toLowerCase());
    history.replaceState(null, "", url.toString());
    
    // Close the modal
    const modal = M.Modal.getInstance(document.getElementById('roleCourseModal'));
    modal.close();
    
    window.alert(`Role: ${role}, Course: ${course} selected`);
    
    // Update UI
    updateAuthUI(true);
    
    // Reload the page to refresh UI completely
    setTimeout(() => {
      window.location.reload();
    }, 500);
  } catch (err) {
    console.error('Role assignment error:', err);
    window.alert(`Role assignment failed: ${err.message}`);
    
    // Optional: Store basic info even if the server request failed
    // This allows the user to continue using the application locally
    localStorage.setItem('authUser', JSON.stringify({
      userId: userId,
      role: role.toLowerCase(),
      roleAssigned: true,
      primaryCourse: course,
      courses: role.toLowerCase() === "professor" ? [course] : [],
      enrolledCourses: role.toLowerCase() === "student" ? [course] : []
    }));
    
    // Update UI anyway
    updateAuthUI(true);
  }
}

// Function to update UI based on authentication state
function updateAuthUI(isAuthenticated = true) {
  console.log("Updating UI, authenticated:", isAuthenticated);
  
  // Get references to UI elements, checking if they exist
  const loginButton = document.getElementById('loginButton');
  const registerButton = document.getElementById('registerButton');
  const signOutButton = document.getElementById('signOutButton');
  const bodyInfo = document.getElementById('bodyInfo');
  const checkInButton = document.getElementById('checkIn');
  const viewAttendanceButton = document.getElementById('viewAttendance');
  
  if (isAuthenticated) {
    // Get user data from localStorage
    const storedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    console.log("Stored user data:", storedUser);
    
    // Hide login/register buttons, show logout button
    if (loginButton) loginButton.style.display = 'none';
    if (registerButton) registerButton.style.display = 'none';
    if (signOutButton) signOutButton.style.display = 'block';
    if (bodyInfo) bodyInfo.style.display = 'flex'; // Change to flex to match original style
    
    // Initialize UI based on role
    const role = storedUser.role;
    console.log("User role:", role);
    
    if (role === 'Professor' || role === 'professor') {
      if (checkInButton) checkInButton.style.display = 'none';
      if (viewAttendanceButton) {
        viewAttendanceButton.style.display = 'block';
        // Remove any existing event listeners to prevent duplicates
        const newButton = viewAttendanceButton.cloneNode(true);
        viewAttendanceButton.parentNode.replaceChild(newButton, viewAttendanceButton);
        // Re-add the event listener
        document.getElementById('viewAttendance').addEventListener("click", function () {
          viewAllAttendanceRecords();
        });
      }
    } else if (role === 'Student' || role === 'student') {
      if (viewAttendanceButton) viewAttendanceButton.style.display = 'none';
      if (checkInButton) {
        checkInButton.style.display = 'block';
        // Remove any existing event listeners to prevent duplicates
        const newButton = checkInButton.cloneNode(true);
        checkInButton.parentNode.replaceChild(newButton, checkInButton);
        // Re-add the event listener
        document.getElementById('checkIn').addEventListener("click", function () {
          checkIn();
        });
      }
    }
  } else {
    // Show login/register buttons, hide logout button
    if (loginButton) loginButton.style.display = 'block';
    if (registerButton) registerButton.style.display = 'block';
    if (signOutButton) signOutButton.style.display = 'none';
    if (bodyInfo) bodyInfo.style.display = 'none';
    if (checkInButton) checkInButton.style.display = 'none';
    if (viewAttendanceButton) viewAttendanceButton.style.display = 'none';
  }
}
// Function to view all attendance records (for professors)
async function viewAllAttendanceRecords() {
  const storedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
  if (!storedUser || storedUser.role !== 'Professor') {
    window.alert('Only professors can view all attendance records');
    return;
  }
  
  try {
    // Get class selection
    const classSelectHTML = `
      <div class="input-field">
        <select id="attendance-class-select">
          <option value="" disabled selected>Choose a class</option>
          <option value="CS1501">CS1501</option>
          <option value="CS1502">CS1502</option>
          <option value="CS1520">CS1520</option>
          <option value="CS1550">CS1550</option>
          <option value="CS1555">CS1555</option>
          <option value="CS1635">CS1635</option>
          <option value="CS1660">CS1660</option>
        </select>
        <label>Select Class</label>
      </div>
      <div class="center-align" style="margin-top: 20px;">
        <button id="view-attendance-submit" class="waves-effect waves-light btn">View Attendance</button>
      </div>
    `;
    
    const container = document.getElementById('attendance-details');
    container.innerHTML = classSelectHTML;
    
    // Initialize select
    var elems = document.querySelectorAll('select');
    M.FormSelect.init(elems);
    
    // Add event listener to the view button
    document.getElementById('view-attendance-submit').addEventListener('click', async function() {
      const courseId = document.getElementById('attendance-class-select').value;
      if (!courseId) {
        window.alert('Please select a class');
        return;
      }
      
      await viewAttendance(courseId);
    });
    
  } catch (err) {
    console.error('Error setting up attendance view:', err);
    window.alert('Error setting up attendance view: ' + err.message);
  }
}

// Override viewAttendance to display more information
viewAttendance = async function(courseId) {
  if (firebase.auth().currentUser || authDisabled()) {
    try {
      const token = await createIdToken();
      const storedUser = JSON.parse(localStorage.getItem('authUser') || '{}');

      if (!courseId) {
        window.alert('Course ID is required.');
        return;
      }

      const role = 'Professor';

      // Try getting attendance from the FastAPI backend
      const response = await fetch(`/attend?courseId=${courseId}&user_role=${role}`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'same-origin', // Changed from 'include' to 'same-origin'
      });

      if (response.ok) {
        const html = await response.text();
        document.getElementById("attendance-details").innerHTML = html;
        
        // Add a back button
        const backButton = document.createElement('button');
        backButton.className = 'btn blue waves-effect waves-light';
        backButton.innerText = 'Back to Class Selection';
        backButton.style.marginTop = '20px';
        backButton.addEventListener('click', function() {
          viewAllAttendanceRecords();
        });
        
        document.getElementById("attendance-details").appendChild(backButton);
      } else {
        const errorData = await response.json();
        window.alert(`Failed! ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error when viewing attendance:', err);
      window.alert('Something went wrong... Please try again!');
    }
  } else {
    window.alert('User not signed in.');
  }
};

// Override checkIn to handle both AuthServer and FastAPI
checkIn = async function() {
  console.log(`Checking in for...`);
  
  // First check if we have a user in localStorage
  const storedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
  
  // Firebase authentication check
  if (firebase.auth().currentUser || storedUser.userId || authDisabled()) {
    try {
      // Get Firebase token if available
      let token = "test-token";
      if (firebase.auth().currentUser) {
        token = await firebase.auth().currentUser.getIdToken();
      }
      
      // Use either Firebase user or stored user
      const user = firebase.auth().currentUser || {
        displayName: storedUser.fullName,
        uid: storedUser.userId
      };
      
      const params = new URLSearchParams(window.location.search);
      const courseId = params.get("courseId") || storedUser.courseId;
      const role = params.get("role") || storedUser.role;

      if (!courseId) {
        window.alert("Please select a course first.");
        return;
      }

      // Use the FastAPI endpoint for attendance
      const formData = new URLSearchParams();
      formData.append('name', user.displayName || storedUser.fullName);
      formData.append('uid', user.uid || storedUser.userId);
      formData.append('courseId', courseId);
      formData.append("role", role);
      
      // Add AuthServer ID to form data
      if (storedUser && storedUser.userId) {
        formData.append('authServerId', storedUser.userId);
      }

      console.log("Submitting attendance with:", {
        name: user.displayName || storedUser.fullName,
        uid: user.uid || storedUser.userId,
        courseId: courseId,
        role: role,
        authServerId: storedUser.userId
      });

      const response = await fetch('/attend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'same-origin',
        body: formData.toString()
      });

      if (response.ok) {
        window.alert("Attendance marked successfully!");
        showConfirmation(user.displayName || storedUser.fullName, Date.now(), courseId);
      } else {
        const errorText = await response.text();
        console.error("Attendance error response:", errorText);
        throw new Error('Failed to mark attendance');
      }
    } catch (err) {
      console.error(`Error when checking in: ${err}`);
      window.alert('Something went wrong... Please try again!');
    }
  } else {
    console.error("No authenticated user found");
    window.alert('User not signed in. Please sign in first.');
  }
};

// Check authentication status on page load
window.addEventListener('DOMContentLoaded', async function() {
  try {
    // First, check if we have a stored user
    const storedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    const hasStoredUser = storedUser && storedUser.userId;
    
    if (hasStoredUser) {
      console.log("Found stored authentication:", storedUser);
      updateAuthUI(true);
    }
    
    // Then try to check with server
    const response = await fetch(`${AUTH_SERVER_URL}/api/auth/status`, {
      mode: 'cors',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Auth status from server:', data);
      
      if (data.authenticated) {
        // Store user data
        localStorage.setItem('authUser', JSON.stringify({
          userId: data.userId,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          roleAssigned: data.roleAssigned,
          // Keep any existing course data
          courseId: storedUser.courseId || data.courseId,
          courses: storedUser.courses || []
        }));
        
        // Update UI based on authentication
        updateAuthUI(true);
      } else if (!hasStoredUser) {
        // Only clear if we don't have a stored user
        localStorage.removeItem('authUser');
        updateAuthUI(false);
      }
    } else if (!hasStoredUser) {
      // Server check failed but we still have stored user
      updateAuthUI(false);
    }
  } catch (err) {
    console.error('Error checking auth status:', err);
    
    // Use stored authentication data as fallback
    const storedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    if (storedUser && storedUser.userId) {
      console.log("Using stored authentication as fallback");
      updateAuthUI(true);
    } else {
      updateAuthUI(false);
    }
  }
  
  // Also initialize the app based on URL params
  initApp();
  
  // Check Firebase auth as well
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in with Firebase
      console.log('Firebase user signed in:', user.displayName);
    } else {
      // No user is signed in with Firebase
      console.log('No Firebase user signed in');
    }
  });
});
  
  // Also check Firebase auth
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in with Firebase
      console.log('Firebase user signed in:', user.displayName);
    } else {
      // No user is signed in with Firebase
      console.log('No Firebase user signed in');
    }
  });

console.log('AuthServer integration loaded with updated CORS settings');