---
title: AngularTS
---

{{< blocks/cover color="white" height="full" >}}

<div class="text-center" ng-app>
  <h1 class="display-1 mt-0 mt-md-5 pb-4">Angular<span>TS</span></h1>
</div>

<p class="lead mb-5">A modern, reactive and typesafe evolution of the classic JS framework from Google&copy;</p>

<div id="download">
  <span id="version"></span>
  <a class="btn btn-lg btn-secondary me-3 mb-4" href="https://github.com/Angular-Wave/angular.ts">
    Download <i class="fab fa-github ms-2 "></i>
  </a>
  <script defer>
    const versionSpan = document.getElementById("version");
    const updateVersion = () => versionSpan.textContent = `Latest release: ${window.angular.version}`;
    if (window.angular) {
      updateVersion()
    } else {
      window.addEventListener("AngularLoaded", updateVersion)
    }    
  </script>
</div>

{{< /blocks/cover >}}
