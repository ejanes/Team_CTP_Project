Describe:
Added the function of deleting an account. When the account is deleted, all unexpired posts published by the user will be deleted. The same account will no longer be able to be logged in. The same username will be able to be registered again

Test:
1. Create two different accounts in two browsers
2. Confirm that the same username cannot be created again
3. Log in to the account and use browser A to publish posts. Refresh the browser to confirm that both browsers can see the new posts.
4. Move the mouse to the header icon and click Delete Account. After completing the confirmation, it is confirmed that the account has been logged out and cannot publish posts or interact. Confirm in another browser that the previously published post has been deleted.
5. Log in with the original username and password in the login area, and confirm that you cannot log in.
6. Register a new account with the original username and confirm that the new account is registered.