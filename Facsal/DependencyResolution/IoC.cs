// --------------------------------------------------------------------------------------------------------------------
// <copyright file="IoC.cs" company="Web Advanced">
// Copyright 2012 Web Advanced (www.webadvanced.com)
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// </copyright>
// --------------------------------------------------------------------------------------------------------------------


using Facsal.Validators;
using FacsalData.UnitOfWork;
using SalaryEntities.UnitOfWork;
using StructureMap;
using StructureMap.Graph;
using StructureMap.Web.Pipeline;

namespace Facsal.DependencyResolution {
    public static class IoC {
        public static IContainer Initialize() {
            ObjectFactory.Initialize(x =>
                        {
                            x.Scan(scan =>
                                    {
                                        scan.TheCallingAssembly();
                                        scan.WithDefaultConventions();
                                    });

                            x.For<IUnitOfWork>().Use("Getting Unit of Work connection",
                                () => new UnitOfWork(new BreezeValidator())
                            ).LifecycleIs<HttpContextLifecycle>();
                        });
            return ObjectFactory.Container;
        }
    }
}