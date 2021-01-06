import Storage from 'web-storage-cache'

const localStorage = new Storage()

function setLocalStorage(key, value) {
  return localStorage.set(key, value)
}

function getLocalStorage(key) {
  return localStorage.get(key)
}

export function removeLocalStorage(key) {
  return localStorage.delete(key)
}

export function clearLocalStorage() {
  return localStorage.clear()
}

export function getLocalRegions() {
  return getLocalStorage('regions')
}

export function saveLocalRegions(value) {
  if (value){
    return setLocalStorage('regions', value)
  } else {
    return removeLocalStorage('regions')
  }
}
