(function(){
  const electron = require('electron')
  const { ipcRenderer } = electron
  console.log(process)

  const tabManage = document.querySelectorAll('.tab-manage')
  const contentManage = document.querySelectorAll('.content-manage')
  const taskTodo = document.querySelector('.task-todo')
  const taskFinished = document.querySelector('.task-finished')
  const keepTimesDom = document.querySelector('.keep-times')
  const closeDom = document.querySelector('.close')
  const date = new Date(), nowTime = date.getTime()
  
    /** task data structure
   * name,
   * time
   **/

  //localStorage存储数据
  let loginTime = localStorage.getItem('loginTime')
  let tasksTodo = localStorage.getItem('tasksTodo') 
  let tasksFinished = localStorage.getItem('tasksFinished')
  let keepTimes = localStorage.getItem('keepTimes')

  tasksTodo = tasksTodo ? JSON.parse(tasksTodo) : []
  tasksFinished = tasksFinished ? JSON.parse(tasksFinished) : []
  keepTimes = keepTimes ? keepTimes : 0

  //判断上次登录时间，如果是今天，则任务，否则清空
  if(!loginTime){
    loginTime = nowTime
  }else{
    const loginD = new Date(loginTime).getTime()
    if(date.getDate() !== loginD.getDate() || nowTime - loginTime >= 24 * 3600 * 1000){
      tasksFinished  = []
      tasksTodo = []
      localStorage.setItem('tasksFinished', JSON.stringify(tasksFinished))
      localStorage.setItem('tasksTodo', JSON.stringify(tasksTodo))
    }
  }



  //初始化
  //填入日期
  document.querySelector('.date').innerText = `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`
  genTodo()
  genFinished()

  //绑定事件
  tabManage.forEach((el,index) => {
    el.addEventListener('click', () => {
      activeTab (index)
      activeContent (index)
    })
  })

  taskTodo.addEventListener('click', (event) => {
    const target = event.target
    const index = target.getAttribute("data-index")
    if(target.classList.contains('finish')){
      keepTimes = +keepTimes + 1
      tasksFinished.push(tasksTodo[index])
      tasksTodo.splice(index,1)
      localStorage.setItem('tasksTodo', JSON.stringify(tasksTodo))
      localStorage.setItem('tasksFinished', JSON.stringify(tasksFinished))
      localStorage.setItem('keepTimes', keepTimes)
      genFinished ()
      genTodo ()
      activeTab (1)
      activeContent (1)
    }
    else if(target.classList.contains('delete')){
      tasksTodo.splice(index,1)
      localStorage.setItem('tasksTodo', JSON.stringify(tasksTodo))
      activeTab (0)
      activeContent (0)
      genTodo ()
    }
  })

  closeDom.addEventListener('click', () => {
    ipcRenderer.send('mainWindow:close')
  })

  //新建任务
  const taskName = document.querySelector('#taskName')
  const taskTime = document.querySelector('#taskTime')
  document.querySelector('.submit-task').addEventListener('click',()=>{
    const name = taskName.value, time = taskTime.value
    tasksTodo.push({
      name: name,
      time: time
    })
    localStorage.setItem('tasksTodo', JSON.stringify(tasksTodo))
    if(!!time) ipcRenderer.send('setTaskTimer', time, encodeURIComponent(name))
    genTodo ()
    activeTab (0)
    activeContent (0)
  })

  
  function genTodo () {
    let todoHtml = ''
    tasksTodo.forEach((item,index) => {
      todoHtml +=
      `<li class="task-item">
        <span class="task-text">${item.name}&nbsp;&nbsp;&nbsp; ${item.time} </span>
        <span>
          <span class="btns finish enable-click" data-index="${index}">完成</span>
          <span class="btns delete enable-click" data-index="${index}">删除</span>
        </span>
      </li>`
    })
    taskTodo.innerHTML = todoHtml
  }

  function genFinished () {
    let finishHtml = ''
    tasksFinished.forEach((item) => {
      finishHtml += 
      `<li class="task-item">
        <span class="task-text">${item.name}</span>
        <span class="flag-icon"></span>
      </li>`
    })
    taskFinished.innerHTML = finishHtml
    keepTimesDom.innerHTML = keepTimes
  }

  function activeTab (index) {
    tabManage.forEach((tabEl) => {
      tabEl.classList.remove('nav-active')
    })
    tabManage[index].classList.add('nav-active')
  }

  function activeContent (index) {
    contentManage.forEach((taskEl) => {
      taskEl.classList.remove('content-active')
    })
    contentManage[index].classList.add('content-active')
    taskName.value = ''
    taskTime.value = ''
  }

})();