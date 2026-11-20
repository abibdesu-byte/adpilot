// A call-button tap opens the dialer; it does not establish that a call connected.
// No analytics or advertising libraries are loaded by this site.
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-call]');
  if (!link) return;
  const detail = {
    topic: document.body.dataset.topic,
    placement: link.dataset.call,
    action: 'open_phone_dialer'
  };
  document.dispatchEvent(new CustomEvent('egd:call-click', { detail }));
});
