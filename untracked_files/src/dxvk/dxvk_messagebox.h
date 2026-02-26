/*
* RASTER REMIX: Stub replacement for the removed rtx_render/rtx_env.h messageBox utility.
* The original used RtxOptions::Automation::disableBlockingDialogBoxes() to conditionally
* suppress the dialog — we always show it in this simplified version.
*/
#pragma once

#include <cstdint>
#include <windows.h>

namespace dxvk {

  inline void messageBox(const char* text, const char* caption, std::uint32_t type) {
    MessageBox(NULL, text, caption, type | MB_ICONSTOP);
  }

}
