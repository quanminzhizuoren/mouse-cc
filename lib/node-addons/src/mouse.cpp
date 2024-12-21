#include <napi.h>
#include <windows.h>

// 模拟鼠标事件，根据按钮名称
void simulateMouseEvent(const std::string &button, bool down)
{
  UINT flags = 0;
  if (button == "left")
  {
    flags = down ? MOUSEEVENTF_LEFTDOWN : MOUSEEVENTF_LEFTUP;
  }
  else if (button == "right")
  {
    flags = down ? MOUSEEVENTF_RIGHTDOWN : MOUSEEVENTF_RIGHTUP;
  }
  else if (button == "middle")
  {
    flags = down ? MOUSEEVENTF_MIDDLEDOWN : MOUSEEVENTF_MIDDLEUP;
  }

  if (flags != 0)
  {
    mouse_event(flags, 0, 0, 0, 0);
  }
  else
  {
    // 可以选择抛出一个错误，或者只是不执行任何操作
    // 这里我们选择不执行任何操作，并可能通过日志记录或调试信息来通知开发者
  }
}

// 鼠标按下
Napi::Value MousePress(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsString())
  {
    Napi::TypeError::New(env, "Argument must be a string specifying the button (e.g., 'left', 'right', 'middle')").ThrowAsJavaScriptException();
  }
  std::string button = info[0].As<Napi::String>().Utf8Value();
  simulateMouseEvent(button, true);
  return Napi::Boolean::New(env, true);
}

// 鼠标松开
Napi::Value MouseRelease(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsString())
  {
    Napi::TypeError::New(env, "Argument must be a string specifying the button (e.g., 'left', 'right', 'middle')").ThrowAsJavaScriptException();
  }
  std::string button = info[0].As<Napi::String>().Utf8Value();
  simulateMouseEvent(button, false);
  return Napi::Boolean::New(env, true);
}

// 鼠标移动跳转到指定坐标位置
Napi::Value MouseMove(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsObject())
  {
    Napi::TypeError::New(env, "Argument must be an object with x and y properties").ThrowAsJavaScriptException();
  }

  Napi::Object obj = info[0].As<Napi::Object>();
  Napi::Value xValue = obj.Get("x");
  Napi::Value yValue = obj.Get("y");
  if (!xValue.IsNumber() || !yValue.IsNumber())
  {
    Napi::TypeError::New(env, "x and y must be numbers").ThrowAsJavaScriptException();
  }

  double x = xValue.As<Napi::Number>().DoubleValue();
  double y = yValue.As<Napi::Number>().DoubleValue();

  SetCursorPos(x, y);

  return Napi::Boolean::New(env, true);
}

// 初始化模块
Napi::Object Init(Napi::Env env, Napi::Object exports)
{
  exports.Set(Napi::String::New(env, "down"), Napi::Function::New(env, MousePress));
  exports.Set(Napi::String::New(env, "up"), Napi::Function::New(env, MouseRelease));
  exports.Set(Napi::String::New(env, "to"), Napi::Function::New(env, MouseMove));
  return exports;
}

NODE_API_MODULE(addon, Init)