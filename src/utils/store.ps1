param(
    [string]$action,
    [string]$hwndStr = "0"
)

# Reference assemblies list
$refs = @(
    "System.Runtime",
    "C:\WINDOWS\Microsoft.Net\assembly\GAC_MSIL\System.Runtime.WindowsRuntime\v4.0_4.0.0.0__b77a5c561934e089\System.Runtime.WindowsRuntime.dll",
    "C:\Windows\System32\WinMetadata\Windows.Services.winmd",
    "C:\Windows\System32\WinMetadata\Windows.Foundation.winmd",
    "C:\Windows\System32\WinMetadata\Windows.ApplicationModel.winmd",
    "C:\Program Files (x86)\Windows Kits\10\UnionMetadata\Facade\Windows.WinMD"
)

$csharpCode = @"
using System;
using Windows.Services.Store;

public class StoreBridge {
    [System.Runtime.InteropServices.Guid("3E68D4BD-BD85-40A8-971A-33D0D0888D4D")]
    [System.Runtime.InteropServices.InterfaceType(System.Runtime.InteropServices.ComInterfaceType.InterfaceIsIUnknown)]
    public interface IInitializeWithWindow {
        void Initialize(IntPtr hwnd);
    }

    public static string CheckLicense() {
        try {
            StoreContext context = StoreContext.GetDefault();
            if (context == null) {
                return "{\"isPro\":false,\"error\":\"App has no package identity (not installed via Store/MSIX)\"}";
            }
            
            var op = context.GetAppLicenseAsync();
            var task = System.WindowsRuntimeSystemExtensions.AsTask(op);
            StoreAppLicense license = task.GetAwaiter().GetResult();
            
            if (license != null) {
                bool isPro = false;
                foreach (var addOnLicense in license.AddOnLicenses) {
                    if (addOnLicense.Value.IsActive) {
                        isPro = true;
                    }
                }
                if (license.IsActive && !license.IsTrial) {
                    isPro = true;
                }
                return string.Format("{{\"isPro\":{0},\"isActive\":{1},\"isTrial\":{2}}}",
                    isPro.ToString().ToLower(),
                    license.IsActive.ToString().ToLower(),
                    license.IsTrial.ToString().ToLower());
            }
            return "{\"isPro\":false,\"error\":\"License object was null\"}";
        }
        catch (Exception e) {
            return string.Format("{{\"isPro\":false,\"error\":\"{0}\"}}", e.Message.Replace("\"", "\\\"").Replace("\r", "").Replace("\n", " "));
        }
    }

    public static string PurchaseApp(string hwndStr) {
        try {
            StoreContext context = StoreContext.GetDefault();
            if (context == null) {
                return "{\"success\":false,\"error\":\"App has no package identity (not installed via Store/MSIX)\"}";
            }

            long hwndVal = 0;
            if (long.TryParse(hwndStr, out hwndVal) && hwndVal != 0) {
                IntPtr hwnd = new IntPtr(hwndVal);
                IInitializeWithWindow initializer = (IInitializeWithWindow)(object)context;
                initializer.Initialize(hwnd);
            }

            string proSkuStoreId = "9NBLGGH420XX"; 
            var op = context.RequestPurchaseAsync(proSkuStoreId);
            var task = System.WindowsRuntimeSystemExtensions.AsTask(op);
            StorePurchaseResult result = task.GetAwaiter().GetResult();
            
            if (result != null) {
                bool success = result.Status == StorePurchaseStatus.Succeeded || result.Status == StorePurchaseStatus.AlreadyPurchased;
                string errMsg = result.ExtendedError != null ? result.ExtendedError.Message : "";
                return string.Format("{{\"success\":{0},\"status\":\"{1}\",\"error\":\"{2}\"}}",
                    success.ToString().ToLower(),
                    result.Status,
                    errMsg.Replace("\"", "\\\""));
            }
            return "{\"success\":false,\"error\":\"Purchase response was null\"}";
        }
        catch (Exception e) {
            return string.Format("{{\"success\":false,\"error\":\"{0}\"}}", e.Message.Replace("\"", "\\\"").Replace("\r", "").Replace("\n", " "));
        }
    }
}
"@

Add-Type -TypeDefinition $csharpCode -ReferencedAssemblies $refs

if ($action -eq "check") {
    $res = [StoreBridge]::CheckLicense()
    Write-Output $res
}
elseif ($action -eq "purchase") {
    $res = [StoreBridge]::PurchaseApp($hwndStr)
    Write-Output $res
}
