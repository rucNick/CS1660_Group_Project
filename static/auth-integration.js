const originalSignIn = signIn;
const originalSignOut = signOut;

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
    
    // Call AuthServer to register the Google user
    const response = await fetch(`${AUTH_SERVER_URL}/api/auth/google/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
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

        // Call AuthServer to assign role
        const roleResponse = await fetch(`${AUTH_SERVER_URL}/api/auth/role`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            userId: authData.userId || result.user.uid,
            role: role,
            studentId: role === 'Student' ? 'STUDENT-123' : null // Example student ID
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

        initApp();
      };
    } else {
      window.alert(`Welcome back, ${result.user.displayName}!`);
      
      // Set URL parameters based on stored role
      const url = new URL(window.location.href);
      url.searchParams.set("role", authData.role);
      history.replaceState(null, "", url.toString());
      
      initApp();
    }
    
  } catch (err) {
    console.error('Authentication error:', err);
    window.alert(`Sign in failed: ${err.message}`);
  }
};

// Override signOut function to use AuthServer
signOut = async function() {
  try {
    // Call AuthServer logout
    await fetch(`${AUTH_SERVER_URL}/api/auth/logout`, {
      method: 'GET'
    });
    
    // Clear local storage
    localStorage.removeItem('authUser');
    
    // Also log out from Firebase
    await firebase.auth().signOut();
    
    console.log('Successfully logged out');
    window.alert('You have been logged out');
    
    // Update UI
    document.getElementById('signInButton').innerText = 'Sign In with Google';
    document.getElementById('bodyInfo').style.display = 'none';
    
  } catch (err) {
    console.error('Logout error:', err);
    window.alert(`Sign out failed: ${err.message}`);
  }
};

// Check authentication status on page load
window.addEventListener('DOMContentLoaded', async function() {
  try {
    // Check auth status with AuthServer
    const response = await fetch(`${AUTH_SERVER_URL}/api/auth/status`, {
      credentials: 'include' // Include cookies for session
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Auth status:', data);
      
      if (data.authenticated) {
        // Store user data
        localStorage.setItem('authUser', JSON.stringify({
          userId: data.userId,
          email: data.email,
          fullName: data.fullName,
          role: data.role,
          roleAssigned: data.roleAssigned
        }));
      } else {
        localStorage.removeItem('authUser');
      }
    }
  } catch (err) {
    console.error('Error checking auth status:', err);
  }
});

console.log('AuthServer integration loaded');