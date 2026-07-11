package org.example.plugin.api;


public interface Plugin {

    String getName();

    String getDescription();

    String execute(PluginContext context) throws Exception;
}
