package com.hellowatch

import android.view.InputDevice
import android.view.MotionEvent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "HelloWatch"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun dispatchGenericMotionEvent(ev: MotionEvent): Boolean {
    if (ev.action == MotionEvent.ACTION_SCROLL &&
        ev.isFromSource(InputDevice.SOURCE_ROTARY_ENCODER)) {
      val delta = ev.getAxisValue(MotionEvent.AXIS_SCROLL)
      if (delta != 0f) {
        reactHost?.currentReactContext?.emitDeviceEvent("rotaryScroll", delta.toDouble())
        return true
      }
    }
    return super.dispatchGenericMotionEvent(ev)
  }
}
