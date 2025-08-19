using System;
using System.Threading.Tasks;
using Xunit;
using System.IO;
using Stomadiagnosis.Host.Services;

namespace Stomadiagnosis.Host.UnitTests
{
    public class ApiServiceTests
    {
        [Fact]
        public async Task ApiService_ShouldStartAndStop()
        {
            // Arrange
            var apiService = new ApiService(0); // Use port 0 to get a random free port
            
            try
            {
                // Act
                await apiService.StartAsync();
                
                // Assert
                Assert.True(apiService.IsRunning);
                Assert.NotNull(apiService.ApiUrl);
                Assert.NotNull(apiService.SwaggerUrl);
                Assert.Contains("http://localhost:", apiService.ApiUrl);
                
                // Test stopping
                await apiService.StopAsync();
                Assert.False(apiService.IsRunning);
            }
            catch (Exception)
            {
                await apiService.StopAsync();
                throw;
            }
        }

        [Fact]
        public void ApiService_ShouldHaveCorrectUrls()
        {
            // Arrange
            const int port = 5678;
            var apiService = new ApiService(port);
            
            // Act & Assert
            Assert.Equal($"http://localhost:{port}", apiService.ApiUrl);
            Assert.Equal($"http://localhost:{port}/swagger", apiService.SwaggerUrl);
        }
    }
}