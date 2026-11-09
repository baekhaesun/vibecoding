function setupPersonalActivity(step, openActivity, isSaving) {
  const form = document.getElementById('personalCodeForm');
  const input = document.getElementById('personalCode');
  const studentFields = ['personalGrade', 'personalClass', 'personalNumber'].map(id => document.getElementById(id));
  const create = document.getElementById('createPersonalCode');
  const status = document.getElementById('personalCodeStatus');
  const activity = document.getElementById('personalActivity');
  const access = document.getElementById('personalAccess');

  function studentCode() {
    const [grade, classNo, number] = studentFields.map(field => String(Number(field.value)));
    return grade + classNo.padStart(2, '0') + number.padStart(2, '0');
  }

  form.reset();
  create.addEventListener('click', () => {
    if (!studentFields.every(field => field.reportValidity())) return;
    input.type = 'text';
    input.value = studentCode();
    input.focus();
    input.select();
    status.textContent = '학년·반·번호로 코드를 만들었어요. 내 활동 열기를 누르세요.';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const student = studentFields.map(field => Number(field.value)).join(':');
    const code = input.value.trim().toLowerCase();
    const existingCode = /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(code);
    if (code !== studentCode() && !existingCode) {
      status.textContent = '학년·반·번호와 일치하는 5자리 코드 또는 기존 개인 코드를 입력하세요.';
      return;
    }

    const open = form.querySelector('button[type=submit]');
    open.disabled = create.disabled = input.readOnly = true;
    studentFields.forEach(field => { field.disabled = true; });
    status.textContent = '내 활동을 확인하는 중…';
    try {
      const data = new TextEncoder().encode('vibecoding-personal-v1:' + step + ':' + student + ':' + code);
      const digest = await crypto.subtle.digest('SHA-256', data);
      const hex = Array.from(new Uint8Array(digest).slice(0, 16), byte => byte.toString(16).padStart(2, '0')).join('');
      const appId = [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
      await openActivity(appId);
      form.reset();
      input.type = 'password';
      status.textContent = '';
      access.hidden = true;
      activity.hidden = false;
      document.getElementById('closePersonalActivity').focus();
    } catch (error) {
      status.textContent = '활동을 열지 못했습니다. 연결 설정을 확인한 뒤 다시 시도하세요. (' + error.message + ')';
    } finally {
      open.disabled = create.disabled = input.readOnly = false;
      studentFields.forEach(field => { field.disabled = false; });
    }
  });
  document.getElementById('closePersonalActivity').addEventListener('click', () => {
    if (isSaving()) return;
    activity.hidden = true;
    location.reload();
  });
  window.addEventListener('pagehide', () => { activity.hidden = true; });
  window.addEventListener('pageshow', event => {
    if (event.persisted) location.reload();
  });
}
