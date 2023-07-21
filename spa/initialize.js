/**
 * make component for vew
 * @param view
 */
function make(view) {
  // eslint-disable-next-line no-throw-literal
  throw { message: 'not impl' }
}

function storage(key, value) {
  if (value === undefined) {
    return localStorage.getItem(key)
  }
  if (value === null) {
    localStorage.removeItem(key)
    return
  }
  localStorage.setItem(key, value)
}
function accessToken(name, token) {
  if (token === undefined) {
    const access_token = storage(name)
    const access_token_expires = storage(name + '_expires')
    if (access_token && access_token_expires > +new Date()) {
      return access_token
    }
    return null
  }
  if (token === null) {
    storage(name, null)
    storage(name + '_expires', null)
    return
  }
  storage(name, token.access_token)
  storage(name + '_expires', (token.expires - 60) * 1000)
}

function debounceFunction(fn, timeout) {
  let timer = 0
  return function() {
    if (timer) window.clearTimeout(timer)
    const args = arguments
    const that = this
    timer = window.setTimeout(function() {
      fn.apply(that, args)
    }, timeout)
  }
}

function submitForm(method, url, params) {
  const form = document.createElement('form')
  form.style.display = 'none'
  form.method = method
  form.action = url
  form.target = '_blank'

  for (const name in params) {
    if (!params.hasOwnProperty(name)) continue
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = params[name]
    form.appendChild(input)
  }

  document.body.appendChild(form)
  form.submit()
  form.parentNode.removeChild(form)
}

(function() {
  function getButtons(options, dialog, h) {
    var buttons = []
    var buttonDefines = []
    if (options.showCancelButton !== false) {
      buttonDefines.push({
        text: options.cancelButtonText || '取消',
        type: options.cancelButtonType || 'default',
        dialogResult: 'cancel'
      })
    }
    if (options.buttons) {
      buttonDefines = buttonDefines.concat(options.buttons)
    }

    if (options.showConfirmButton !== false) {
      buttonDefines.push({
        text: options.confirmButtonText || '确定',
        type: options.confirmButtonType || 'primary',
        dialogResult: 'confirm'
      })
    }

    for (var i = 0; i < buttonDefines.length; i++) {
      buttons.push((function(button) {
        return h('el-button', {
          props: { type: button.type || 'default', size: 'small' },
          'class': [button.customClass || ''],
          on: {
            click: function() {
              var ref = dialog.$refs['dialog-contents-ref']
              if (button.dialogResult === 'confirm') {
                if (ref && ref.done) {
                  ref.done(function(...argvs) {
                    dialog.clickButton(button, ...argvs)
                  })
                  return
                }
              }
              if (button.dialogResult !== 'cancel') {
                if (ref && ref[button.dialogResult]) {
                  ref[button.dialogResult](function(...argvs) {
                    dialog.clickButton(button, ...argvs)
                  })
                  return
                }
              }
              dialog.clickButton(button)
            }
          }
        }, button.text)
      })(buttonDefines[i]))
    }
    return buttons
  }

  /**
   * 弹出对话框（可自由设置对话框内容，表单等）
   * */

  Vue.prototype.$win = function(contents, options) {
    if (options === undefined) {
      options = contents
      contents = options.component || ''
      options.component = null
    }
    options = Jazor.Utils.deepClone(options)
    var $el = null
    var vue = new Vue({
      data: function() {
        return {
          visible: true
        }
      },
      methods: {
        close: function() {
          this.visible = false
        },
        clickButton: function(button, ...argvs) {
          var _this = this
          if (button.click) {
            button.click(function() {
              _this.visible = false
            }, ...argvs)
          } else if (button.dialogResult === 'confirm' && options.done) {
            options.done(function() {
              _this.visible = false
            }, ...argvs)
          } else if (button.dialogResult === 'cancel' && options.cancel) {
            options.cancel(function() {
              _this.visible = false
            }, ...argvs)
          } else if (options.buttonClick) {
            options.buttonClick(button.dialogResult, function() {
              _this.visible = false
            }, ...argvs)
          } else {
            this.visible = false
          }
        }
      },
      render: function(h) {
        var _this = this
        var vNode = h(contents, {
          ref: 'dialog-contents-ref',
          props: options['props'] || {},
          on: {
            'close': function(dialogResult) {
              _this.clickButton({ dialogResult: dialogResult }, ...argvs)
            },
            'confirm': function(...argvs) {
              _this.clickButton({ dialogResult: 'confirm' }, ...argvs)
            },
            'cancel': function(...argvs) {
              _this.clickButton({ dialogResult: 'cancel' }, ...argvs)
            }
          }
        })

        var nodes = [vNode]
        if (options.hideFooter !== true) {
          var buttons = getButtons(options, this, h)

          if (buttons.length > 0) {
            nodes.push(h('div', {
              slot: 'footer',
              'style': {
                padding: '10px 20px 0',
                textAlign: options['footerAlign'] || 'right',
                boxSizing: 'border-box'
              }
            }, buttons))
          }
        }

        return h(
          'el-dialog',
          {
            staticClass: 'el-dialog__jazor-wrapper ' + (options['staticClass'] || ''),
            'class': {
              'el-dialog__has__footer': options.hideFooter !== true && buttons.length > 0
            },
            props: {
              visible: _this.visible,
              title: options.title || '',
              width: options.width || '40%',
              top: options.top || '8vh',
              customClass: options.customClass || '',
              closeOnClickModal: options.closeOnClickModal === true,
              showClose: options.showClose !== false,
              lockScroll: options.lockScroll === true,
              beforeClose: function(done) {
                if (options.buttonClick) {
                  options.buttonClick('close', done)
                } else {
                  done()
                }
              }
            },
            on: {
              'update:visible': function(val) {
                _this.visible = val
              },
              'close': function() {
                vue.$destroy()
                document.body.removeChild($el)
                $el = null
              }
            }
          },
          nodes
        )
      }
    })
    vue.$mount()
    document.body.appendChild($el = vue.$el)
    return {
      close: function() {
        vue.close && vue.close()
      }
    }
  }

  Vue.prototype.$input = function(title, initValue, placeholder, textArea, width) {
    if (initValue && typeof initValue === 'object') {
      placeholder = initValue.placeholder || ''
      textArea = initValue.type === 'textarea'
      width = initValue.width || ''
      initValue = initValue.initValue || ''
    }
    return new Promise(function(resolve, reject) {
      Vue.prototype.$win({
        title: title,
        showCancelButton: false,
        showConfirmButton: false,
        showClose: false,
        width: width || '400px',
        component: {
          data() {
            return {
              value_: ''
            }
          },
          mounted() {
            this.value_ = initValue || ''
          },
          render(h) {
            const that = this
            return h('div', [
              h('el-input', {
                props: {
                  value: that.value_,
                  type: textArea === true ? 'textarea' : 'text'
                },
                attrs: {
                  placeholder: placeholder || '',
                  rows: textArea === true ? 4 : 2
                },
                staticClass: 'mb-20',
                on: {
                  input(value) {
                    that.value_ = value
                  }
                }
              }),
              h('div', { staticClass: 'ta-right pb-20' }, [
                h('el-button', {
                  props: { type: 'info', size: 'small' },
                  on: {
                    click() {
                      that.$emit('cancel')
                    }
                  }
                }, '取消'),
                h('el-button', {
                  props: { type: 'primary', size: 'small' },
                  on: {
                    click() {
                      that.$emit('confirm', that.value_)
                    }
                  }
                }, '确定')
              ])
            ])
          }
        },
        done(done, value) {
          resolve({ value, done })
        },
        cancel(done) {
          done()
          reject('user cancel')
        }
      })
    })
  }
})()

Vue.prototype.$scroll = (function() {
  var events = []
  var contexts = []

  var func = function(onScroll, context, timeout) {
    if (timeout !== undefined) {
      onScroll = debounceFunction(onScroll, timeout)
    }
    events.push(onScroll)
    contexts.push(context || null)
  }
  func.off = function(onScroll) {
    var idx = -1
    for (var i = 0; i < events.length; i++) {
      if (events[i] === onScroll) {
        idx = i
        break
      }
    }
    if (idx === -1) return
    events.splice(idx, 1)
    contexts.splice(idx, 1)
  }

  function onScroll() {
    const top = window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop

    const documentHeight =
      document.documentElement.clientHeight ||
      document.body.offsetHeight

    for (let i = 0; i < events.length; i++) {
      events[i].call(contexts[i] || null, top, documentHeight)
    }
  }

  window.addEventListener('scroll', onScroll)
  return func
})();

(function() {
  const ws = [
    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  ]
  const ms = [
    ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', ''],
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', '']
  ]
  const CB = function(diff) {
    const dt = this
    switch (diff) {
      case 'dddd' :
        return ws[0][dt.getDay()]
      case 'ddd' :
        return ws[1][dt.getDay()]
      case 'MMMM' :
        return ms[0][dt.getMonth()]
      case 'MMM' :
        return ms[1][dt.getMonth()]
      case 'yyyy' :
        return dt.getFullYear()
      case 'M' :
        return dt.getMonth() + 1
      case 'MM' :
        return ('0' + (dt.getMonth() + 1)).slice(-2)
      case 'd' :
        return dt.getDate()
      case 'dd' :
        return ('0' + dt.getDate()).slice(-2)
      case 'HH' :
        return ('0' + dt.getHours()).slice(-2)
      case 'h' :
        return dt.getHours()
      case 'm' :
        return dt.getMinutes()
      case 'mm' :
        return ('0' + dt.getMinutes()).slice(-2)
      case 's' :
        return dt.getSeconds()
      case 'ss' :
        return ('0' + dt.getSeconds()).slice(-2)
      case 'tttt' :
        return dt.getMilliseconds()
      default :
        return diff
    }
  }

  window.formatDateTime = function formatDateTime(format, dateTime) {
    if (dateTime && !(dateTime instanceof Date)) return dateTime
    return format.replace(/(yyyy|mmmm|mmm|mm|dddd|ddd|dd|hh|ss|tttt|m|d|h|s)/ig, (function(cb, date) {
      return function(diff) {
        return cb.call(date, diff)
      }
    })(CB, dateTime || new Date()))
  }
})()

