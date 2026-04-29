if (document.getElementById('posts')) {
    loadPosts();
}
if (document.getElementById('postName')) {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    showPostData(id);
}
if (document.getElementById('userName')) {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    loadAccount(id);
}
if (document.getElementById('userList')) {
    loadUserList();
}
async function loadUserList() {
    const response = await fetch('/getUsers');
    const users = await response.json();
    renderUserList(users);
}
function renderUserList(userList) {
    const container = document.getElementById('userList');
    container.innerHTML = '';
    for (const user of userList) {
        container.innerHTML += `
        <a href='account.html?id=${user.id}'><h1>${user.name}</h1></a> 
        <br><i>Уникальный ID${user.id}</i>
        <br><br><button data-id=${user.id} onclick="deleteUser(this)">удалить учетную запись</button>
            <br><br>
        `;
    }
}
async function deleteUser(button) {
    const userId = button.getAttribute('data-id');
    const response = await fetch(`/deleteUser?id=${userId}`, { method: 'DELETE' })
    location.reload();
}
async function loadAccount(id) {
    const response = await fetch(`/getAccount?accountId=${id}`)
    if (response.ok) {
        const user = await response.json();
        console.log(`я получил вот этого юзера: ${user.id}`);
        renderAccountDate(user);
    }
}
function renderAccountDate(user) {
    const userName = document.getElementById('userName');
    const userPosts = document.getElementById('userPosts');
    const userId = document.getElementById('userId');
    userName.innerText = user.name;
    userId.innerHTML = `Уникальный ID: ${user.id}`
    renderAccountPosts(user);
}
function renderAccountPosts(user) {
    const container = document.getElementById('accountPosts');
    console.log("загружаю его посты", user.name);
    for (const post of user.posts) {
        const commentsLength = post.comments.length;
        console.log(commentsLength)
        console.log(post.user)
        container.innerHTML += `
        <li>
            <a href="post.html?id=${post.id}">${post.postName}</a>
            <br><b><span>${post.visualContent}</span></b>
            <br><i>комментариев: ${commentsLength}</i>
            <br><br>
        </li>
        `;
    }
}
async function showPostData(postId) {
    const response = await fetch(`/getPost?postId=${postId}`)
    console.log("Запрос на URL:");
    const post = await response.json();
    console.log(post.postName, post.globalContent)
    document.getElementById('postName').innerText = post.postName;
    document.getElementById('postGlobalContent').innerText = post.globalContent;
    document.getElementById('postData').innerHTML += `<br><br><span>автор публикации: </span><a href='account.html?id=${post.user.id}'>${post.user.name}</a>`;
    const container = document.getElementById('comments');
    console.log("сейчас будет фор");
    console.log(post.comments.length)
    document.getElementById('commentsCount').innerText += ` ${post.comments.length}`
    container.innerHTML = '';
    for (const comment of post.comments) {
        container.innerHTML += `
            <b><a href='account.html?id=${comment.userId}'>${comment.user.name}</a></b>
            <span>${comment.content}</span>
            <br><br>
        `;

    }
}
async function checkData() {
    const pName = document.getElementById('newPostName').value;
    const pVisContent = document.getElementById('newPostVisualContent').value;
    const pGlobContent = document.getElementById('newPostGlobalContent').value;
    const pUserId = document.getElementById('newPostUserId').value;
    const butt = document.getElementById('addPostButton');
    if (!pUserId) {
        butt.disabled = true;
        return;
    }
    const response = await fetch(`/thisUserIdIsExists?id=${pUserId}`);
    const exists = await response.json();
    console.log(exists)

    if (pName.length == 0 || pVisContent.length == 0 || pGlobContent.length == 0 || !exists) {
        butt.disabled = true;
    }
    else {
        butt.disabled = false;
    }
}
async function checkCommentLength() {
    const commentContent = document.getElementById('commentContent').value;
    const commentUserId = document.getElementById('commentUserId').value;
    const button = document.getElementById('addComemntBtn');
    if (!commentUserId) {
        button.disabled = true;
        return;
    }
    const response = await fetch(`/thisUserIdIsExists?id=${commentUserId}`);
    const exists = await response.json();
    if (commentContent.length == 0 || !exists) {
        button.disabled = true;
    }
    else {
        button.disabled = false;
    }
}
async function addComment() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const commentContent = document.getElementById('commentContent').value;
    const commentUserId = document.getElementById('commentUserId').value;
    const response = await fetch('/addComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            CommentContent: commentContent,
            UserId: commentUserId,
            PostId: id
        })
    });
    if (response.ok) {
        document.getElementById('ifAdded').innerText = "Комментарий добавлен"
        document.getElementById('commentContent').value = '';
        document.getElementById('commentUserId').value = '';
        location.reload();
    }
}
async function deletePost() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const response = await fetch(`/deletePost?id=${id}`, { method: 'DELETE' })
    window.location.href = 'posts.html'
}
async function addPost() {
    const pName = document.getElementById('newPostName').value;
    const pVisContent = document.getElementById('newPostVisualContent').value;
    const pGlobContent = document.getElementById('newPostGlobalContent').value;
    const pUserId = document.getElementById('newPostUserId').value;
    const response = await fetch('/addPost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            reqPostName: pName,
            reqPostVisualContent: pVisContent,
            reqPostGlobalContent: pGlobContent,
            reqPostUserId: pUserId
        })
    });
    if (response.ok) {
        document.getElementById('ifAdded').innerText = 'Пост был добавлен';
        pName.value = '';
        pVisContent.value = '';
        pGlobContent.value = '';
        pUserId.value = '';
    }
    else {
        document.getElementById('ifAdded').innerText = 'Произошла какая то ошибка, возможно такого ID Пользователя не существует';
    }

}
async function loadPosts() {
    const response = await fetch('/getPosts');
    const posts = await response.json();
    rednerPosts(posts)
    console.log(posts.length)
}
function rednerPosts(posts) {
    const container = document.getElementById('posts');
    container.innerHTML = '';
    for (const post of posts) {
        const commentsLength = post.comments.length;
        console.log(post.user.name)
        container.innerHTML += `
        <li>
            <b><a href="account.html?id=${post.user.id}">${post.user.name}</b> </a>
            <a href="post.html?id=${post.id}">${post.postName}</a>
            <br><b><span>${post.visualContent}</span></b>
            <br><i>комментариев: ${commentsLength}</i>
            <br><br>
        </li>
        `;
    }
}
async function sendRegisterDataToServer() {
    document.getElementById('registerMessage').value = '';
    const nameData = document.getElementById('inputUserName').value;
    const passwordData = document.getElementById('inputUserPassword').value;
    if (nameData.length == 0) {
        document.getElementById('registerMessage').innerText = 'Введите имя';
        return;
    }
    const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Name: nameData, Password: passwordData })
    });
    if (!response.ok) {
        const message = await response.text();
        document.getElementById('registerMessage').innerText = message;
        document.getElementById('inputUserName').value = '';
        console.log('Не зарегестрирован');
    }
    else {
        const message = await response.text();
        document.getElementById('registerMessage').innerText = message;
        document.getElementById('inputUserName').value = '';
        document.getElementById('inputUserPassword').value = '';
        console.log('Зарегестрирован');
    }
}