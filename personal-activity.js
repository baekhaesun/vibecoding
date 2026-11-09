function setupPersonalActivity(step, openActivity, isSaving) {
  const form = document.getElementById('personalCodeForm');
  const input = document.getElementById('personalCode');
  const studentFields = ['personalGrade', 'personalClass', 'personalNumber'].map(id => document.getElementById(id));
  const create = document.getElementById('createPersonalCode');
  const status = document.getElementById('personalCodeStatus');
  const activity = document.getElementById('personalActivity');
  const access = document.getElementById('personalAccess');

  form.reset();
  create.addEventListener('click', () => {
    input.type = 'text';
    input.value = crypto.randomUUID();
    input.focus();
    input.select();
    status.textContent = '선택된 코드를 안전한 곳에 복사하거나 적어 둔 뒤 내 활동 열기를 누르세요.';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const student = studentFields.map(field => Number(field.value)).join(':');
    const code = input.value.trim().toLowerCase();
    if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(code)) {
      status.textContent = '만들어 둔 개인 코드 전체를 붙여넣거나 새 코드를 만드세요.';
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
