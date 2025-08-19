using System;
using System.Configuration;
using System.Data;
using System.IO;
using System.Windows;

namespace Stomadiagnosis.Host;

/// <summary>
/// Interaction logic for App.xaml
/// </summary>
public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        try
        {
            // Force create log file immediately
            File.WriteAllText("wv2.log", $"[{DateTime.Now}] App OnStartup called - FORCED WRITE\n");
            
            // Start the API host with fire-and-forget
            _ = ApiHost.StartAsync();
            File.AppendAllText("wv2.log", $"[{DateTime.Now}] ApiHost.StartAsync() called (fire-and-forget)\n");
            
            base.OnStartup(e);
            File.AppendAllText("wv2.log", $"[{DateTime.Now}] base.OnStartup(e) completed\n");
        }
        catch (Exception ex)
        {
            File.WriteAllText("wv2.log", $"[{DateTime.Now}] Exception in OnStartup: {ex.Message}\n{ex.StackTrace}\n");
            throw;
        }
    }
}

