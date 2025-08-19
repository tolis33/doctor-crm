using System;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using Xunit;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Moq;
using Stomadiagnosis.Host.Services;
using Stomadiagnosis.Host.Data;
using System.Net;

namespace Stomadiagnosis.Host.Tests
{
    public class ApiServiceTests
    {
        [Fact]
        public void ApiService_ShouldInitializeCorrectly()
        {
            // Arrange & Act
            var apiService = new ApiService(5678);

            // Assert
            Assert.Equal("http://localhost:5678", apiService.ApiUrl);
            Assert.Equal("http://localhost:5678/swagger", apiService.SwaggerUrl);
            Assert.False(apiService.IsRunning);
        }

        [Fact]
        public void ApiService_ShouldUseDefaultPort_WhenNotSpecified()
        {
            // Arrange & Act
            var apiService = new ApiService();

            // Assert
            Assert.Equal("http://localhost:5000", apiService.ApiUrl);
            Assert.Equal("http://localhost:5000/swagger", apiService.SwaggerUrl);
        }

        [Fact]
        public async Task StartAsync_ShouldSetIsRunningToTrue()
        {
            // This test requires integration testing or more complex mocking
            // because it interacts with Kestrel server and real database
            
            // Arrange - Setup minimal mock environment
            var port = GetFreePort();
            var appDataPath = Path.Combine(Path.GetTempPath(), $"StomadiagnosisTest_{Guid.NewGuid()}");
            Directory.CreateDirectory(appDataPath);

            try
            {
                // Create API service with test environment
                var apiService = new TestApiService(port, appDataPath);
                
                // Act
                await apiService.StartAsync();
                
                // Assert
                Assert.True(apiService.IsRunning);

                // Cleanup
                await apiService.StopAsync();
            }
            finally
            {
                // Cleanup temp directory
                if (Directory.Exists(appDataPath))
                {
                    Directory.Delete(appDataPath, true);
                }
            }
        }

        [Fact]
        public async Task StopAsync_ShouldSetIsRunningToFalse()
        {
            // Arrange
            var port = GetFreePort();
            var appDataPath = Path.Combine(Path.GetTempPath(), $"StomadiagnosisTest_{Guid.NewGuid()}");
            Directory.CreateDirectory(appDataPath);

            try
            {
                var apiService = new TestApiService(port, appDataPath);
                await apiService.StartAsync();
                Assert.True(apiService.IsRunning);

                // Act
                await apiService.StopAsync();

                // Assert
                Assert.False(apiService.IsRunning);
            }
            finally
            {
                if (Directory.Exists(appDataPath))
                {
                    Directory.Delete(appDataPath, true);
                }
            }
        }

        private int GetFreePort()
        {
            // Get a free port for testing
            var listener = new System.Net.Sockets.TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            var port = ((IPEndPoint)listener.LocalEndpoint).Port;
            listener.Stop();
            return port;
        }

        /// <summary>
        /// Test version of ApiService that uses in-memory database
        /// </summary>
        private class TestApiService : ApiService
        {
            private readonly string _testAppDataPath;

            public TestApiService(int port, string appDataPath) : base(port)
            {
                _testAppDataPath = appDataPath;
            }

            protected override void ConfigureServices(IServiceCollection services)
            {
                // Use in-memory database instead of SQLite
                services.AddDbContext<StomadiagnosisDbContext>(options =>
                    options.UseInMemoryDatabase("TestDatabase"));

                // Add other services
                services.AddEndpointsApiExplorer();
                services.AddSwaggerGen();
                services.AddCors();
            }

            protected override string GetAppDataPath()
            {
                return _testAppDataPath;
            }
        }
    }
}