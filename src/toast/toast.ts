export const createToast = (target: HTMLElement) => (text: string) => {
  target.textContent = text
  target.classList.remove('showing')
  void target.offsetWidth
  target.classList.add('showing')
}
